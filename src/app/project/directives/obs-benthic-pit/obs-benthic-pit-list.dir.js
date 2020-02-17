angular.module('app.project').directive('obsBenthicPitList', [
  'offlineservice',
  'utils',
  '$timeout',
  'TransectService',
  'ModalService',
  'ValidatorService',
  'BenthicAttributeService',
  function(
    offlineservice,
    utils,
    $timeout,
    TransectService,
    ModalService,
    ValidatorService,
    BenthicAttributeService
  ) {
    'use strict';
    return {
      restrict: 'EA',
      require: '^form',
      scope: {
        obsBenthicPits: '=',
        benthicAttributeChoices: '=',
        transectLengthSurveyed: '=',
        intervalSize: '=',
        isDisabled: '=?'
      },
      templateUrl:
        'app/project/directives/obs-benthic-pit/obs-benthic-pit-list.tpl.html',
      link: function(scope, element, attrs, formCtrl) {
        const $table = $(element).find('table');
        let modal;

        scope.categoryLookup = {};
        scope.benthicAttributesLookup = {};
        scope.isDisabled = utils.truthy(scope.isDisabled);
        scope.choices = {};
        scope.editableObservationIndex = null;
        scope.validator = ValidatorService;

        const getRowIndex = function($index) {
          return $index == null ? scope.obsBenthicPits.length - 1 : $index;
        };

        const setInputFocus = function(rowIndex, cellIndex) {
          $timeout(function() {
            const $elm = $($table.find('tbody tr')[rowIndex]);
            $($elm.find('select, input')[cellIndex])
              .focus()
              .select();
          }, 30);
        };

        const loadBenthicAttributesLookup = function() {
          scope.benthicAttributesLookup = utils.createLookup(
            scope.benthicAttributeChoices
          );
        };

        loadBenthicAttributesLookup();

        scope.getBenthicAttributes = function() {
          if (_.isFunction(scope.benthicAttributeChoices)) {
            return scope.benthicAttributeChoices();
          }
          return scope.benthicAttributeChoices;
        };

        const benthicAttributeNames = scope
          .getBenthicAttributes()
          .map(attribute => attribute.name);

        scope.categoryLookup = BenthicAttributeService.getCategoryLookup(
          scope.benthicAttributeChoices
        );

        scope.modalConfig = {
          bodyTemplateUrl:
            'app/_mermaid_common/libs/partials/benthicattribute-input-new.tpl.html',
          controller: 'BenthicAttributeModalCtrl'
        };

        scope.modalTrigger = function(observation) {
          modal = ModalService.open(scope.modalConfig);
          modal.result.then(function(record) {
            scope.benthicAttributeChoices.push(record);
            loadBenthicAttributesLookup();
            observation.attribute = record.id;
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
          if (scope.isDisabled === true) {
            return;
          }

          scope.obsBenthicPits = scope.obsBenthicPits || [];
          const nextIndex = getRowIndex($index) + 1;
          let nextCol = 'attr';
          let newRecord = {}; // simple add row

          if (!$event || $event.keyCode === 13 || $event.keyCode === 9) {
            if ($event && $event.keyCode === 9) {
              // if tab, duplicate row and focus on val
              nextCol = 'interval';
              newRecord = _.omit(scope.obsBenthicPits[$index], [
                'id',
                '$$hashKey',
                '$$uid',
                nextCol
              ]);
            }

            scope.obsBenthicPits.splice(nextIndex, 0, newRecord);
            formCtrl.$setDirty();
            scope.startEditing(null, nextIndex);

            setInputFocus(nextIndex, 1);
          }
        };

        scope.deleteRow = function(observation) {
          if (scope.isDisabled === true) {
            return;
          }

          scope.obsBenthicPits = scope.obsBenthicPits || [];
          const idx = scope.obsBenthicPits.indexOf(observation);
          if (idx !== -1) {
            scope.obsBenthicPits.splice(idx, 1);
          }
          formCtrl.$setDirty();
        };

        scope.$watch(
          'intervalSize',
          function(newVal, oldVal) {
            if (newVal == null || newVal === oldVal) {
              return;
            }

            TransectService.setObservationIntervals(
              scope.obsBenthicPits,
              scope.intervalSize
            );
          },
          true
        );

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
            benthicAttributeNames.includes(evt.target.outerText) ||
            benthicAttributeNames.includes(evt.target.textContent)
          ) {
            return;
          }
          scope.stopEditing();
        });

        scope.$watch(
          'obsBenthicPits',
          function(newVal, oldVal) {
            if (newVal == null || newVal === oldVal) {
              return;
            }

            TransectService.setObservationIntervals(
              scope.obsBenthicPits,
              scope.intervalSize
            );
          },
          true
        );
      }
    };
  }
]);
