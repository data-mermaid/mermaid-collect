angular.module('app.project').directive('obsBenthicLitList', [
  'OfflineCommonTables',
  'TransectService',
  'utils',
  '$timeout',
  'BenthicAttributeService',
  'ValidatorService',
  'ModalService',
  function(
    OfflineCommonTables,
    TransectService,
    utils,
    $timeout,
    BenthicAttributeService,
    ValidatorService,
    ModalService
  ) {
    'use strict';
    return {
      restrict: 'EA',
      require: '^form',
      scope: {
        obsBenthicLits: '=',
        benthicAttributeChoices: '=',
        isDisabled: '=?'
      },
      templateUrl:
        'app/project/directives/obs-benthic-lit/obs-benthic-lit-list.tpl.html',
      link: function(scope, element, attrs, formCtrl) {
        let modal;
        let watchTimeoutPromise;

        scope.isReady = false;
        utils.assignUniqueId(scope.obsBenthicLits);
        scope.isReady = true;

        scope.notFoundMessage =
          "Benthic attribute cannot be found in site's region.";
        scope.observation_calcs = {};
        scope.categoryLookup = {};
        scope.isDisabled = utils.truthy(scope.isDisabled);
        scope.choices = {};
        scope.editableObservationIndex = null;
        scope.validator = ValidatorService;

        const getRowIndex = function($index) {
          return $index == null ? scope.obsBenthicLits.length - 1 : $index;
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
          const benthicAttributes = scope.getBenthicAttributes();
          scope.benthicAttributesLookup = utils.createLookup(benthicAttributes);
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
            _updateBenthicPercentages();
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

          scope.obsBenthicLits = scope.obsBenthicLits || [];
          const nextIndex = getRowIndex($index) + 1;
          let nextCol = 'attr';
          let newRecord = {}; // simple add row

          if (!$event || $event.keyCode === 13 || $event.keyCode === 9) {
            if ($event && $event.keyCode === 9) {
              // if tab, duplicate row and focus on val
              nextCol = 'length';
              newRecord = _.omit(scope.obsBenthicLits[$index], [
                'id',
                '$$hashKey',
                nextCol,
                '$$uid'
              ]);
            }

            newRecord.$$uid = utils.generateUuid();
            scope.obsBenthicLits.splice(nextIndex, 0, newRecord);
            formCtrl.$setDirty();
            scope.startEditing(null, nextIndex);

            setInputFocus(nextIndex, 0);
          }
        };

        scope.deleteRow = function(observation) {
          if (scope.isDisabled === true) {
            return;
          }

          scope.obsBenthicLits = scope.obsBenthicLits || [];
          const idx = scope.obsBenthicLits.indexOf(observation);
          if (idx !== -1) {
            scope.obsBenthicLits.splice(idx, 1);
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

        const _updateBenthicPercentages = function() {
          $timeout.cancel(watchTimeoutPromise);
          loadBenthicAttributesLookup();
          watchTimeoutPromise = $timeout(function() {
            scope.observation_calcs = TransectService.calcBenthicPercentages(
              scope.obsBenthicLits,
              scope.benthicAttributesLookup,
              'length'
            );
          }, 300);
        };

        scope.onModalSave = function() {
          _updateBenthicPercentages();
        };

        scope.$watch(
          'obsBenthicLits',
          function() {
            _updateBenthicPercentages();
          },
          true
        );

        scope.$watch(
          'categoryLookup',
          function() {
            _updateBenthicPercentages();
          },
          true
        );

        loadBenthicAttributesLookup();
      }
    };
  }
]);
