angular.module('app.project').directive('obsBenthicPqtList', [
  'OfflineCommonTables',
  'utils',
  '$timeout',
  'TransectService',
  'ModalService',
  'ValidatorService',
  'BenthicAttributeService',
  function(
    OfflineCommonTables,
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
        obsBenthicPqts: '=',
        benthicAttributeChoices: '=',
        isDisabled: '=?'
      },
      templateUrl:
        'app/project/directives/obs-benthic-pqt/obs-benthic-pqt-list.tpl.html',
      link: function(scope, element, attrs, formCtrl) {
        let modal;

        scope.isReady = false;
        utils.assignUniqueId(scope.obsBenthicPqts);
        scope.isReady = true;

        scope.notFoundMessage =
          "Benthic attribute cannot be found in site's region.";
        scope.categoryLookup = {};
        scope.benthicAttributesLookup = {};
        scope.isDisabled = utils.truthy(scope.isDisabled);
        scope.choices = {};
        scope.editableObservationIndex = null;
        scope.validator = ValidatorService;

        const getRowIndex = function($index) {
          return $index == null ? scope.obsBenthicPqts.length - 1 : $index;
        };

        const setInputFocus = function(rowIndex, cellIndex) {
          $timeout(function() {
            const $elm = $($(element).find('table tbody tr')[rowIndex]);
            $($elm.find('select, input')[cellIndex])
              .focus()
              .select();
          }, 30);
        };

        const loadBenthicAttributesLookup = function() {
          scope.benthicAttributesLookup = utils.createLookup(
            scope.getBenthicAttributes()
          );
        };

        scope.getBenthicAttributes = function() {
          return scope.benthicAttributeChoices.filtered;
        };

        const benthicAttributeNames = scope
          .getBenthicAttributes()
          .map(attribute => attribute.name);

        scope.categoryLookup = BenthicAttributeService.getCategoryLookup(
          scope.getBenthicAttributes()
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

        OfflineCommonTables.ChoicesTable(true).then(function(table) {
          return table.filter().then(function(choices) {
            _.each(choices, function(c) {
              scope.choices[c.name] = c.data;
            });
          });
        });

        scope.navInputs = function($event, obs, isRowEnd, $index) {
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

          scope.obsBenthicPqts = scope.obsBenthicPqts || [];
          const nextIndex = getRowIndex($index) + 1;
          let nextCol = 'attr';
          let newRecord = {}; // simple add row

          if (!$event || $event.keyCode === 13 || $event.keyCode === 9) {
            if ($event && $event.keyCode === 9) {
              // if tab, duplicate row and focus on val
              nextCol = 'interval';
              newRecord = _.omit(scope.obsBenthicPqts[$index], [
                'id',
                '$$hashKey',
                '$$uid',
                nextCol
              ]);
            }

            newRecord.$$uid = utils.generateUuid();
            scope.obsBenthicPqts.splice(nextIndex, 0, newRecord);
            formCtrl.$setDirty();
            scope.startEditing(null, nextIndex);
            setInputFocus(nextIndex, 0);
          }
        };

        scope.deleteRow = function(observation) {
          if (scope.isDisabled === true) {
            return;
          }

          scope.obsBenthicPqts = scope.obsBenthicPqts || [];
          const idx = scope.obsBenthicPqts.indexOf(observation);
          if (idx !== -1) {
            scope.obsBenthicPqts.splice(idx, 1);
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
            benthicAttributeNames.includes(evt.target.outerText) ||
            benthicAttributeNames.includes(evt.target.textContent)
          ) {
            return;
          }
          scope.stopEditing();
        });

        scope.$watchGroup(['intervalSize', 'intervalStart'], function(
          newVal,
          oldVal
        ) {
          if (newVal == null || newVal === oldVal) {
            return;
          }

          TransectService.setObservationIntervals(
            scope.obsBenthicPqts,
            scope.intervalSize,
            null,
            scope.intervalStart
          );
        });

        scope.$watch(
          'obsBenthicPqts',
          function(newVal, oldVal) {
            if (newVal == null || newVal === oldVal) {
              return;
            }

            TransectService.setObservationIntervals(
              scope.obsBenthicPqts,
              scope.intervalSize,
              null,
              scope.intervalStart
            );
          },
          true
        );

        loadBenthicAttributesLookup();
      }
    };
  }
]);
