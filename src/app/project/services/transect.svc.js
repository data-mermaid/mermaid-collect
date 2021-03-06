angular.module('app.project').service('TransectService', [
  '$q',
  '$stateParams',
  '$window',
  'APP_CONFIG',
  'utils',
  'OfflineCommonTables',
  'OfflineTables',
  'authService',
  function(
    $q,
    $stateParams,
    $window,
    APP_CONFIG,
    utils,
    OfflineCommonTables,
    OfflineTables,
    authService
  ) {
    'use strict';

    const getFishAttributeLookup = function(observations) {
      let obj = {};
      observations = observations || [];
      for (let n = 0; n < observations.length; n++) {
        const fish_attribute = observations[n].fish_attribute;
        if (fish_attribute == null) {
          continue;
        }
        obj[fish_attribute] = null;
      }
      const fish_attributes = _.keys(obj);
      const filterFunc = function(val) {
        return fish_attributes.indexOf(val) !== -1;
      };
      return OfflineCommonTables.FishAttributesTable()
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
      let ret = null;

      if (
        Number.isFinite(size) &&
        Number.isFinite(count) &&
        Number.isFinite(constant_a) &&
        Number.isFinite(constant_b) &&
        Number.isFinite(constant_c) &&
        Number.isFinite(length) &&
        Number.isFinite(width)
      ) {
        const biomass =
          (count * (constant_a * Math.pow(size * constant_c, constant_b))) /
          1000;
        const area = (length * width) / 10000; // m2 to hectares
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
          const biomassTotal = _.reduce(
            observations,
            function(total, obs) {
              const size =
                Number.isFinite(obs.size) &&
                !(obs.alt_size === 50 && obs.size < 50)
                  ? obs.size
                  : 0;

              const count = Number.isFinite(obs.count) ? obs.count : null;
              const fishAttribute =
                fishAttributeLookups[obs.fish_attribute] || {};
              const constant_a = fishAttribute.biomass_constant_a;
              const constant_b = fishAttribute.biomass_constant_b;
              const constant_c = fishAttribute.biomass_constant_c;
              let width = null;
              if (transectWidth != null) {
                width = getBeltFishWidthVal(size, transectWidth.conditions);
              }
              const biomass =
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

    const calcTotalAbundance = function(observations) {
      const abundanceTotal = _.reduce(
        observations,
        function(total, obs) {
          const count = Number.isFinite(obs.count) ? obs.count : null;
          return total + count;
        },
        0
      );

      return abundanceTotal;
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

    const setObservationIntervals = function(
      obs,
      interval_size,
      attr,
      interval_start
    ) {
      const obs_count = (obs || []).length;
      attr = attr || 'interval';

      if (interval_start == null) {
        interval_start = 1.0;
      }

      if (obs_count === 0) {
        return;
      }

      if (interval_size == null) {
        return;
      }

      let interval = interval_start;
      for (let i = 1; i <= obs_count; i++) {
        if (Number.isInteger(interval) === false) {
          _.set(obs[i - 1], attr, interval.toFixed(2));
        } else {
          _.set(obs[i - 1], attr, interval);
        }
        interval += interval_size;
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

      let category_names;
      let groups;
      let category_percentages;
      let recordset = [];
      let category_total = {};
      let total;

      const getCategory = function(benthicAttribute, benthicAttributesLookup) {
        if (benthicAttribute == null || benthicAttribute.parent == null) {
          return benthicAttribute;
        }
        return getCategory(
          benthicAttributesLookup[benthicAttribute.parent],
          benthicAttributesLookup
        );
      };

      for (let i = 0; i < obsBenthics.length; i++) {
        let benthicAttribute;
        const obs_benthic = obsBenthics[i];

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
      const records = scope.tableControl.getSelectedRecords();
      if (_.isArray(records) === false || records.length === 0) {
        return;
      }

      const record_count = records.length;
      const args = {
        count: record_count
      };
      const message = 'Deleting {{count}} record{{plural}}. Are you sure?';
      if (record_count !== 1) {
        args.plural = 's';
      }
      utils.showConfirmation(
        function() {
          scope.tableControl.deleteRecords(records);
          angular.forEach(records, function(rec) {
            const r = new TransectMethod(rec);
            r.project_pk = $stateParams.project_id;
            r.$delete();
          });
        },
        'Warning',
        utils.template(message, args)
      );
    };

    const downloadFieldReport = function(project_id, protocol, method) {
      const token = authService.getToken();

      const report_url = `${
        APP_CONFIG.apiUrl
      }projects/${project_id}/${protocol}/${method}/csv/?field_report=true&access_token=${token}`;

      $window.open(report_url);
    };

    const getBenthicAttributeChoices = function() {
      return OfflineCommonTables.BenthicAttributesTable(true).then(function(
        table
      ) {
        return table.filter().then(function(benthicattributes) {
          return createLookup(benthicattributes);
        });
      });
    };

    const getProjectSiteChoices = function(project_id) {
      return OfflineTables.ProjectSitesTable(project_id).then(function(table) {
        return table.filter().then(function(sites) {
          return createLookup(sites);
        });
      });
    };

    const getProjectManagementChoices = function(project_id) {
      return OfflineTables.ProjectManagementsTable(project_id).then(function(
        table
      ) {
        return table.filter().then(function(managements) {
          return createLookup(managements);
        });
      });
    };

    const getProjectProfileChoices = function(project_id) {
      return OfflineTables.ProjectProfilesTable(project_id).then(function(
        table
      ) {
        return table.filter().then(function(project_profiles) {
          return project_profiles;
        });
      });
    };

    const getChoices = function() {
      return OfflineCommonTables.ChoicesTable(true).then(function(table) {
        return table.filter().then(function(choices) {
          const output = {};
          _.each(choices, function(c) {
            output[c.name] = c.data;
          });
          return output;
        });
      });
    };

    const getLookups = function(projectId) {
      const promises = [];

      promises.push(getChoices());
      promises.push(getProjectSiteChoices(projectId));
      promises.push(getProjectManagementChoices(projectId));
      promises.push(getProjectProfileChoices(projectId));

      return $q.all(promises).then(function(results) {
        const lookups = {};
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
      return OfflineCommonTables.ChoicesTable(true).then(function(table) {
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
      calcTotalAbundance: calcTotalAbundance,
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
