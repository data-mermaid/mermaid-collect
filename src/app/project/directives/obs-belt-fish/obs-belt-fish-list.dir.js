angular.module('app.project').directive('obsBeltFishList', [
  '$window',
  '$state',
  'offlineservice',
  'utils',
  '$timeout',
  'FishAttributeService',
  'ModalService',
  function(
    $window,
    $state,
    offlineservice,
    utils,
    $timeout,
    FishAttributeService,
    ModalService
  ) {
    'use strict';
    return {
      restrict: 'EA',
      require: '^form',
      scope: {
        obsBeltFishes: '=',
        fishsizebin: '=',
        fishAttributeChoices: '=',
        transectLenSurveyed: '=?',
        transectWidth: '=?',
        isDisabled: '=?'
      },
      templateUrl:
        'app/project/directives/obs-belt-fish/obs-belt-fish-list.tpl.html',
      link: function(scope, element, attrs, formCtrl) {
        var modal;
        var $table = $(element).find('table');
        var fishAttributesLookup = {};

        scope.isDisabled = utils.truthy(scope.isDisabled);
        scope.choices = {};
        scope.fishsize_choices = {};
        scope.biomassvalues = {};

        var loadFishAttributesLookup = function() {
          fishAttributesLookup = utils.createLookup(scope.fishAttributeChoices);
        };
        loadFishAttributesLookup();

        scope.getFishAttributes = function() {
          return scope.fishAttributeChoices;
        };

        scope.navReferenceLink = function(fishAttributeId) {
          // console.log(fishAttributeId);
          if (!_.isUndefined(fishAttributeId)) {
            var rank = fishAttributesLookup[fishAttributeId].$$taxonomic_rank;
            var state = null;

            if (rank === FishAttributeService.SPECIES_RANK) {
              state = 'app.reference.fishspeciess.fishspecies';
            } else if (rank === FishAttributeService.GENUS_RANK) {
              state = 'app.reference.fishgenera.fishgenus';
            } else {
              state = 'app.reference.fishfamilies.fishfamily';
            }

            $window.open(
              $state.href(state, { id: fishAttributeId }, { absolute: true }),
              '_blank'
            );
          }
        };

        scope.modalConfig = {
          bodyTemplateUrl:
            'app/_mermaid_common/libs/partials/fishattribute-input-new.tpl.html',
          controller: 'FishSpeciesModalCtrl'
        };
        scope.modalTrigger = function(observation) {
          modal = ModalService.open(scope.modalConfig);
          modal.result.then(function(record) {
            scope.fishAttributeChoices.push(
              FishAttributeService.setMetadata([record])[0]
            );
            loadFishAttributesLookup();
            observation.fish_attribute = record.id;
            utils.showAlert(
              'Proposal submitted',
              'Your proposal will be reviewed by the MERMAID team.',
              utils.statuses.success
            );
          });
        };

        offlineservice.ChoicesTable(true).then(function(table) {
          return table.filter().then(function(choices) {
            _.each(choices, function(c) {
              scope.choices[c.name] = c.data;
            });
          });
        });

        offlineservice.FishSizesTable(true).then(function(table) {
          return table.filter().then(function(fishsizes) {
            _.each(_.sortBy(fishsizes, 'val'), function(fishsize) {
              var key = fishsize.fish_bin_size;
              if (scope.fishsize_choices[key] == null) {
                scope.fishsize_choices[key] = [];
              }
              scope.fishsize_choices[key].push({
                id: fishsize.val,
                name: fishsize.name
              });
            });
          });
        });

        scope.getWidthVal = function(widthkey) {
          var width = _.find(scope.choices.belttransectwidths, {
            id: widthkey
          });
          if (angular.isDefined(width) && angular.isDefined(width.val))
            return width.val;
          return null;
        };

        scope.getNextIndex = function(obs) {
          var index = scope.obsBeltFishes.indexOf(obs);
          return _.parseInt(index) + 1 || scope.obsBeltFishes.length;
        };

        scope.getFormElement = function(selectorPrefix) {
          var retElement = $(element).find(selectorPrefix + ' input');
          if (retElement.length === 0) {
            retElement = $(element).find(selectorPrefix + ' select');
          }
          return retElement;
        };

        scope.addRow = function($event, observation) {
          if (scope.isDisabled) {
            return;
          }

          scope.obsBeltFishes = scope.obsBeltFishes || [];
          var nextIndex = scope.getNextIndex(observation);
          var nextCol = 'attr';
          var newRecord = {}; // simple add row

          if (!$event || $event.keyCode === 13 || $event.keyCode === 9) {
            if ($event && $event.keyCode === 9) {
              // if tab, duplicate row and focus on val
              nextCol = 'size';
              newRecord = _.omit(observation, [
                'id',
                '$$hashKey',
                nextCol,
                'count',
                '$$uid'
              ]);
            }

            utils.assignUniqueId(newRecord);
            scope.obsBeltFishes.splice(nextIndex, 0, newRecord);

            $timeout(function() {
              var $elm = $($table.find('tr')[nextIndex + 1]);
              $($elm.find('input')[0]).focus();
            }, 0);
          }
        };

        scope.deleteRow = function(observation) {
          if (scope.isDisabled) {
            return;
          }

          scope.obsBeltFishes = scope.obsBeltFishes || [];
          var idx = scope.obsBeltFishes.indexOf(observation);
          if (idx !== -1) {
            scope.obsBeltFishes.splice(idx, 1);
            delete scope.biomassvalues[observation.$$hashKey];
          }
          formCtrl.$setDirty();
        };

        scope.$watch(
          'fishsizebin',
          function() {
            _.each(scope.obsBeltFishes, function(obs) {
              var prev_bin_val;
              var bin_val = scope.fishsizebin;
              if (scope.choices.fishsizebins) {
                var current_idx = _.findIndex(
                  scope.choices.fishsizebins,
                  function(item) {
                    return item.id == bin_val;
                  }
                );
                var current_bin_val = scope.choices.fishsizebins[current_idx]
                  ? scope.choices.fishsizebins[current_idx].val
                  : undefined;

                if (obs.size_bin) {
                  var prev_idx = _.findIndex(
                    scope.choices.fishsizebins,
                    function(item) {
                      return item.id == obs.size_bin;
                    }
                  );
                  prev_bin_val = scope.choices.fishsizebins[prev_idx]
                    ? scope.choices.fishsizebins[prev_idx].val
                    : undefined;
                }
                if (current_bin_val > prev_bin_val) {
                  obs.size = null;
                }
              }
              obs.size_bin = bin_val;
            });
          },
          true
        );
      }
    };
  }
]);
