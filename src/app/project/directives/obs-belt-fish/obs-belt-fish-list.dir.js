angular.module('app.project').directive('obsBeltFishList', [
  '$q',
  '$window',
  '$state',
  'OfflineCommonTables',
  'utils',
  '$timeout',
  'FishAttributeService',
  'ValidatorService',
  'TransectService',
  'ModalService',
  function(
    $q,
    $window,
    $state,
    OfflineCommonTables,
    utils,
    $timeout,
    FishAttributeService,
    ValidatorService,
    TransectService,
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
        const $table = $(element).find('table');
        let modal;
        let fishAttributesLookup = {};

        scope.notFoundMessage = "Fish name cannot be found in site's region.";
        scope.isDisabled = utils.truthy(scope.isDisabled);
        scope.choices = {};
        scope.fishsize_choices = {};
        scope.biomassvalues = {};
        scope.editableObservationIndex = null;
        scope.validator = ValidatorService;
        scope.widthValueLookup = {};
        TransectService.getWidthValueLookup().then(function(lookup) {
          scope.widthValueLookup = lookup;
        });

        const getRowIndex = function($index) {
          return $index == null ? scope.obsBeltFishes.length - 1 : $index;
        };

        const setInputFocus = function(rowIndex, cellIndex) {
          $timeout(function() {
            const $elm = $($table.find('tbody tr')[rowIndex]);
            $($elm.find('select, input')[cellIndex])
              .focus()
              .select();
          }, 30);
        };

        const loadFishAttributesLookup = function() {
          fishAttributesLookup = utils.createLookup(scope.getFishAttributes());
        };

        scope.getFishAttributes = function() {
          return scope.fishAttributeChoices.filtered;
        };

        const fishAttributeNames = scope
          .getFishAttributes()
          .map(attribute => attribute.display_name);

        scope.navReferenceLink = function(fishAttributeId) {
          if (!_.isUndefined(fishAttributeId)) {
            let promise = null;
            let state = null;
            console.log(fishAttributesLookup[fishAttributeId]);
            const rank = _.get(
              fishAttributesLookup[fishAttributeId],
              '$$taxonomic_rank'
            );
            console.log('rank', rank);

            if (rank == null) {
              promise = FishAttributeService.fetchFishAttributes({
                id: fishAttributeId
              }).then(function(records) {
                if (records.length === 0) {
                  return null;
                }
                return _.get(records[0], '$$taxonomic_rank');
              });
            } else {
              promise = $q.resolve(rank);
            }

            promise.then(function(rank) {
              if (rank === FishAttributeService.SPECIES_RANK) {
                state = 'app.reference.fishspeciess.fishspecies';
              } else if (rank === FishAttributeService.GENUS_RANK) {
                state = 'app.reference.fishgenera.fishgenus';
              } else if (rank === FishAttributeService.FAMILY_RANK) {
                state = 'app.reference.fishfamilies.fishfamily';
              } else {
                utils.showAlert(
                  'Error',
                  'Attribute cannot be found.',
                  utils.statuses.error,
                  5000
                );
                return;
              }

              $window.open(
                $state.href(state, { id: fishAttributeId }, { absolute: true }),
                '_blank'
              );
            });
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

        OfflineCommonTables.ChoicesTable(true).then(function(table) {
          return table.filter().then(function(choices) {
            _.each(choices, function(c) {
              scope.choices[c.name] = c.data;
            });
          });
        });

        OfflineCommonTables.FishSizesTable(true).then(function(table) {
          return table.filter().then(function(fishsizes) {
            _.each(_.sortBy(fishsizes, 'val'), function(fishsize) {
              let key = fishsize.fish_bin_size;
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

        scope.navInputs = function($event, obs, isRowEnd, $index) {
          isRowEnd = isRowEnd || false;
          if (!$event) {
            return;
          }

          const keyCode = $event.keyCode;

          if (keyCode === 13 || (keyCode === 9 && isRowEnd)) {
            scope.addRow($event, $index);
          }
          $event.stopPropagation();
        };

        scope.addRow = function($event, $index) {
          if (scope.isDisabled) {
            return;
          }

          scope.obsBeltFishes = scope.obsBeltFishes || [];
          const nextIndex = getRowIndex($index) + 1;
          let nextCol = 'attr';
          let newRecord = {}; // simple add row

          if (!$event || $event.keyCode === 13 || $event.keyCode === 9) {
            if ($event && $event.keyCode === 9) {
              // if tab, duplicate row and focus on val
              nextCol = 'size';
              newRecord = _.omit(scope.obsBeltFishes[$index], [
                'id',
                '$$hashKey',
                nextCol,
                'count',
                '$$uid'
              ]);
            }

            scope.obsBeltFishes.splice(nextIndex, 0, newRecord);
            formCtrl.$setDirty();
            scope.startEditing(null, nextIndex);

            setInputFocus(nextIndex, 0);
          }
        };

        scope.deleteRow = function(observation) {
          if (scope.isDisabled) {
            return;
          }

          scope.obsBeltFishes = scope.obsBeltFishes || [];
          const idx = scope.obsBeltFishes.indexOf(observation);
          if (idx !== -1) {
            delete scope.biomassvalues[idx];
            scope.obsBeltFishes.splice(idx, 1);
          }
          formCtrl.$setDirty();
        };

        scope.startEditing = function(evt, idx) {
          if (evt) {
            evt.stopPropagation();
          }

          if (scope.isDisabled) {
            scope.editableObservationIndex = null;
            return;
          }

          if (
            idx === scope.editableObservationIndex &&
            evt &&
            evt.target.nodeName !== 'TD'
          ) {
            return;
          } else if (
            idx === scope.editableObservationIndex &&
            evt &&
            evt.target.nodeName === 'TD'
          ) {
            scope.editableObservationIndex = null;
            return;
          }
          scope.editableObservationIndex = idx;
        };

        scope.stopEditing = function() {
          scope.index = null;
          scope.editableObservationIndex = null;
        };

        $(window).click(function(evt) {
          if (
            evt.target.classList.contains('addRow') ||
            fishAttributeNames.includes(evt.target.outerText) ||
            fishAttributeNames.includes(evt.target.textContent)
          ) {
            return;
          }
          scope.stopEditing();
        });

        scope.$watch(
          'fishsizebin',
          function() {
            _.each(scope.obsBeltFishes, function(obs) {
              let prev_bin_val;
              let bin_val = scope.fishsizebin;
              if (scope.choices.fishsizebins) {
                let current_idx = _.findIndex(
                  scope.choices.fishsizebins,
                  function(item) {
                    return item.id == bin_val;
                  }
                );
                let current_bin_val = scope.choices.fishsizebins[current_idx]
                  ? scope.choices.fishsizebins[current_idx].val
                  : undefined;

                if (obs.size_bin) {
                  let prev_idx = _.findIndex(
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

        loadFishAttributesLookup();
      }
    };
  }
]);
