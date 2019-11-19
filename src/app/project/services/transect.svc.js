angular.module('app.project').service('TransectService', [
  '$q',
  '$stateParams',
  '$window',
  'APP_CONFIG',
  'utils',
  'offlineservice',
  'authService',
  function(
    $q,
    $stateParams,
    $window,
    APP_CONFIG,
    utils,
    offlineservice,
    authService
  ) {
    'use strict';

    const getFishAttributeLookup = function(observations) {
      var obj = {};
      observations = observations || [];
      for (var n = 0; n < observations.length; n++) {
        var fish_attribute = observations[n].fish_attribute;
        if (fish_attribute == null) {
          continue;
        }
        obj[fish_attribute] = null;
      }
      var fish_attributes = _.keys(obj);
      var filterFunc = function(val) {
        return fish_attributes.indexOf(val) !== -1;
      };
      return offlineservice
        .FishAttributesTable()
        .then(function(table) {
          return table.filter({ id: filterFunc });
        })
        .then(function(records) {
          return _.reduce(
            records,
            function(o, record) {
              o[record.id] = {
                biomass_constant_a: record.biomass_constant_a,
                biomass_constant_b: record.biomass_constant_b,
                biomass_constant_c: record.biomass_constant_c
              };
              return o;
            },
            {}
          );
        });
    };

    const calcObsBiomass = function(
      size,
      count,
      constant_a,
      constant_b,
      constant_c,
      length,
      width
    ) {
      var ret = null;

      if (
        Number.isFinite(size) &&
        Number.isFinite(count) &&
        Number.isFinite(constant_a) &&
        Number.isFinite(constant_b) &&
        Number.isFinite(constant_c) &&
        Number.isFinite(length) &&
        Number.isFinite(width)
      ) {
        var biomass =
          (count * (constant_a * Math.pow(size * constant_c, constant_b))) /
          1000;
        var area = (length * width) / 10000; // m2 to hectares
        ret = biomass / area; // result is in kg/ha
      }

      return ret;
    };

    const calcTotalObsBiomass = function(
      observations,
      transectLenSurveyed,
      transectWidth
    ) {
      return getFishAttributeLookup(observations)
        .then(function(lookups) {
          return lookups;
        })
        .then(function(fishAttributeLookups) {
          var biomassTotal;
          biomassTotal = _.reduce(
            observations,
            function(total, obs) {
              var size = Number.isFinite(obs.size) ? obs.size : null;
              var count = Number.isFinite(obs.count) ? obs.count : null;
              var fishAttribute =
                fishAttributeLookups[obs.fish_attribute] || {};
              var constant_a = fishAttribute.biomass_constant_a;
              var constant_b = fishAttribute.biomass_constant_b;
              var constant_c = fishAttribute.biomass_constant_c;
              let width = null;
              if (transectWidth != null) {
                width = getBeltFishWidthVal(size, transectWidth.conditions);
              }
              var biomass =
                calcObsBiomass(
                  size,
                  count,
                  constant_a,
                  constant_b,
                  constant_c,
                  transectLenSurveyed,
                  width
                ) || 0.0;
              return total + biomass;
            },
            0.0
          );

          return biomassTotal;
        });
    };

    const createLookup = function(records) {
      return _.sortBy(
        _.reduce(
          records,
          function(o, record) {
            if (!_.isEmpty(record.name_secondary)) {
              record.name += ' [' + record.name_secondary + ']';
            }
            o[record.id] = record;
            return o;
          },
          {}
        ),
        function(choice) {
          return choice.name.toLowerCase();
        }
      );
    };

    const setObservationIntervals = function(obs, interval_size, attr) {
      var obs_count = (obs || []).length;
      attr = attr || 'interval';

      if (obs_count === 0) {
        return;
      }

      for (var i = 1; i <= obs_count; i++) {
        _.set(obs[i - 1], attr, i * interval_size);
      }
    };

    const calcBenthicPercentages = function(
      obsBenthics,
      benthicAttributesLookup,
      lengthAttr
    ) {
      if (obsBenthics == null || benthicAttributesLookup == null) {
        return;
      }

      var category_names;
      var groups;
      var category_percentages;
      var recordset = [];
      var category_total = {};
      var total;

      var getCategory = function(benthicAttribute, benthicAttributesLookup) {
        if (benthicAttribute == null || benthicAttribute.parent == null) {
          return benthicAttribute;
        }
        return getCategory(
          benthicAttributesLookup[benthicAttribute.parent],
          benthicAttributesLookup
        );
      };

      for (var i = 0; i < obsBenthics.length; i++) {
        var benthicAttribute;
        var obs_benthic = obsBenthics[i];

        if (obs_benthic.attribute == null) {
          continue;
        }

        benthicAttribute = benthicAttributesLookup[obs_benthic.attribute];

        // Combine into one object to do calcs
        recordset.push(
          _.merge(
            {
              category: getCategory(benthicAttribute, benthicAttributesLookup)
            },
            obs_benthic
          )
        );
      }

      groups = _.groupBy(recordset, 'category.name');
      _.each(groups, function(group, category) {
        category_total[category] = _.reduce(
          group,
          function(sum, obs) {
            if (lengthAttr) {
              return utils.safe_sum(sum, _.get(obs, lengthAttr));
            }
            return utils.safe_sum(sum, 1);
          },
          0
        );
      });

      total = _.reduce(
        category_total,
        function(sum, category_total) {
          return utils.safe_sum(sum, category_total);
        },
        0
      );

      category_names = _.keys(groups).sort();
      category_percentages = _.map(category_names, function(category_name) {
        return {
          id: category_name,
          val: utils.safe_multiply(
            utils.safe_division(category_total[category_name], total),
            100
          )
        };
      });

      return {
        category_percentages: category_percentages,
        total: total
      };
    };

    const deleteSelectedTransects = function(scope, TransectMethod) {
      var records = scope.tableControl.getSelectedRecords();
      if (_.isArray(records) === false || records.length === 0) {
        return;
      }

      var record_count = records.length;
      var args = {
        count: record_count
      };
      var message = 'Deleting {{count}} record{{plural}}. Are you sure?';
      if (record_count !== 1) {
        args.plural = 's';
      }
      utils.showConfirmation(
        function() {
          scope.tableControl.deleteRecords(records);
          angular.forEach(records, function(rec) {
            var r = new TransectMethod(rec);
            r.project_pk = $stateParams.project_id;
            r.$delete();
          });
        },
        'Warning',
        utils.template(message, args)
      );
    };

    const downloadFieldReport = function(project_id, field_report_type) {
      var token = authService.getToken();
      var report_url =
        'projects/' + project_id + '/' + field_report_type + '/fieldreport/';
      var url = APP_CONFIG.apiUrl + report_url + '?access_token=' + token;
      $window.open(url);
    };

    const getBenthicAttributeChoices = function() {
      return offlineservice.BenthicAttributesTable(true).then(function(table) {
        return table.filter().then(function(benthicattributes) {
          return createLookup(benthicattributes);
        });
      });
    };

    var getProjectSiteChoices = function(project_id) {
      return offlineservice.ProjectSitesTable(project_id).then(function(table) {
        return table.filter().then(function(sites) {
          return createLookup(sites);
        });
      });
    };

    const getProjectManagementChoices = function(project_id) {
      return offlineservice
        .ProjectManagementsTable(project_id)
        .then(function(table) {
          return table.filter().then(function(managements) {
            return createLookup(managements);
          });
        });
    };

    const getProjectProfileChoices = function(project_id) {
      return offlineservice
        .ProjectProfilesTable(project_id)
        .then(function(table) {
          return table.filter().then(function(project_profiles) {
            return project_profiles;
          });
        });
    };

    const getChoices = function() {
      return offlineservice.ChoicesTable(true).then(function(table) {
        return table.filter().then(function(choices) {
          var output = {};
          _.each(choices, function(c) {
            output[c.name] = c.data;
          });
          return output;
        });
      });
    };

    const getLookups = function(projectId) {
      var promises = [];

      promises.push(getChoices());
      promises.push(getProjectSiteChoices(projectId));
      promises.push(getProjectManagementChoices(projectId));
      promises.push(getProjectProfileChoices(projectId));

      return $q.all(promises).then(function(results) {
        var lookups = {};
        lookups.choices = results[0];
        lookups.choices.sites = results[1];
        lookups.choices.managements = results[2];
        lookups.project_profiles = results[3];

        return lookups;
      });
    };

    const evaluateConditions = function(fishSize, conditionsCombo) {
      const results = _.map(conditionsCombo, function(cond) {
        const op = utils.relationalOperatorFunctions[cond.operator];
        if (op == null) {
          return false;
        }

        return op(fishSize, cond.size);
      });
      return results.every(val => val === true);
    };

    const getBeltFishWidthVal = function(fishSize, beltfishWidthConditions) {
      if (
        fishSize == null ||
        fishSize < 0 ||
        beltfishWidthConditions == null ||
        beltfishWidthConditions.length === 0
      ) {
        return null;
      }

      if (beltfishWidthConditions.length === 1) {
        return beltfishWidthConditions[0].val;
      }

      let defaultCondition = null;
      let conditions = [];
      for (let n = 0; n < beltfishWidthConditions.length; n++) {
        const cnd = beltfishWidthConditions[n];
        if (cnd.operator == null || cnd.size == null) {
          defaultCondition = cnd;
        } else {
          conditions.push(cnd);
        }
      }

      let combos = utils.combinations(beltfishWidthConditions);
      for (let i = 0; i < combos.length; i++) {
        const combo = combos[i];
        if (evaluateConditions(fishSize, combo)) {
          return combo[0].val;
        }
      }
      return (defaultCondition && defaultCondition.val) || null;
    };

    const getWidthValueLookup = function() {
      return offlineservice.ChoicesTable(true).then(function(table) {
        return table
          .filter({ name: 'belttransectwidths' })
          .then(function(choices) {
            const widthValueLookup = {};
            _.each(choices[0].data, function(c) {
              widthValueLookup[c.id] = c;
            });
            return widthValueLookup;
          });
      });
    };

    const TransectService = {
      calcBenthicPercentages: calcBenthicPercentages,
      calcObsBiomass: calcObsBiomass,
      calcTotalObsBiomass: calcTotalObsBiomass,
      deleteSelectedTransects: deleteSelectedTransects,
      downloadFieldReport: downloadFieldReport,
      getBeltFishWidthVal: getBeltFishWidthVal,
      getBenthicAttributeChoices: getBenthicAttributeChoices,
      getChoices: getChoices,
      getLookups: getLookups,
      getProjectManagementChoices: getProjectManagementChoices,
      getProjectProfileChoices: getProjectProfileChoices,
      getProjectSiteChoices: getProjectSiteChoices,
      setObservationIntervals: setObservationIntervals,
      getWidthValueLookup: getWidthValueLookup
    };

    return TransectService;
  }
]);
