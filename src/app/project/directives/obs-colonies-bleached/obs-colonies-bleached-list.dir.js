angular.module('app.project').directive('obsColoniesBleachedList', [
  'offlineservice',
  'utils',
  '$timeout',
  'ModalService',
  'BenthicAttributeService',
  'ValidatorService',
  function(
    offlineservice,
    utils,
    $timeout,
    ModalService,
    BenthicAttributeService,
    ValidatorService
  ) {
    'use strict';
    return {
      restrict: 'E',
      require: '^form',
      scope: {
        obsColoniesBleached: '=',
        benthicAttributeChoices: '=',
        validations: '=',
        isDisabled: '=?'
      },
      templateUrl:
        'app/project/directives/obs-colonies-bleached/obs-colonies-bleached-list.tpl.html',
      link: function(scope, element, attrs, formCtrl) {
        let modal;
        const $table = $(element).find('table');

        scope.formCtrl = formCtrl;
        scope.isDisabled = utils.truthy(scope.isDisabled);
        scope.choices = {};
        scope.editableObservationIndex = null;
        scope.validator = ValidatorService;
        scope.modalConfig = {
          bodyTemplateUrl:
            'app/_mermaid_common/libs/partials/benthicattribute-input-new.tpl.html',
          controller: 'BenthicAttributeModalCtrl'
        };
        scope.rowErrors = [];

        offlineservice.ChoicesTable(true).then(function(table) {
          return table.filter().then(function(choices) {
            _.each(choices, function(c) {
              scope.choices[c.name] = c.data;
            });
          });
        });

        const getRowIndex = function($index) {
          return $index == null ? scope.obsColoniesBleached.length - 1 : $index;
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
          return scope.benthicAttributeChoices;
        };

        scope.categoryLookup = BenthicAttributeService.getCategoryLookup(
          scope.benthicAttributeChoices
        );

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

        scope.navInputs = function($event, obs, isRowEnd, $index) {
          isRowEnd = isRowEnd || false;
          if (!$event) {
            return;
          }

          const keyCode = $event.keyCode;

          if (keyCode === 13 || (keyCode === 9 && isRowEnd)) {
            scope.addRow($event, $index);
          }

          // arrowKeyNav($event, keyCode, $event.target, $index);

          $event.stopPropagation();
        };

        scope.addRow = function($event, $index) {
          if (scope.isDisabled === true) {
            return;
          }

          scope.obsColoniesBleached = scope.obsColoniesBleached || [];
          const nextIndex = getRowIndex($index) + 1;
          const newRecord = {
            count_normal: 0,
            count_pale: 0,
            count_20: 0,
            count_50: 0,
            count_80: 0,
            count_100: 0,
            count_dead: 0
          }; // simple add row

          scope.obsColoniesBleached.splice(nextIndex, 0, newRecord);
          formCtrl.$setDirty();
          scope.startEditing(null, scope.obsColoniesBleached.length - 1);
          setInputFocus(nextIndex, 0);
        };

        scope.deleteRow = function(observation) {
          if (scope.isDisabled === true) {
            return;
          }
          scope.obsColoniesBleached = scope.obsColoniesBleached || [];
          const idx = scope.obsColoniesBleached.indexOf(observation);
          if (idx !== -1) {
            scope.obsColoniesBleached.splice(idx, 1);
          }
          formCtrl.$setDirty();
        };

        scope.startEditing = function(evt, idx) {
          if (evt) {
            evt.stopPropagation();
          }

          scope.index = idx;
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

        $(window).click(function() {
          scope.stopEditing();
        });

        scope.validateCountInput = function(val) {
          const valueExists = ValidatorService.requiresvalue(val);
          const isNotMinValue = ValidatorService.minvalue(val, 0, true);
          const isInteger = ValidatorService.integervalue(val);
          return [
            { isValid: valueExists, message: 'Required' },
            { isValid: isNotMinValue, message: 'Value must be greater than 0' },
            { isValid: isInteger, message: 'Value must be a whole number' }
          ];
        };

        const isDuplicate = function(ob, duplicates) {
          for (let i = 0; i < duplicates.length; i++) {
            if (
              duplicates[i].attribute === ob.attribute &&
              duplicates[i].growth_form === ob.growth_form
            ) {
              return true;
            }
          }
          return false;
        };

        scope.$watch(
          'validations',
          function() {
            const duplicateGenusGrowthValidation = _.get(
              scope.validations,
              'validate_duplicate_genus_growth'
            );

            _.each(scope.obsColoniesBleached, function(obs, idx) {
              scope.rowErrors[idx] =
                duplicateGenusGrowthValidation &&
                duplicateGenusGrowthValidation.status === 'error' &&
                isDuplicate(obs, duplicateGenusGrowthValidation.data);
            });
          },
          true
        );
      }
    };
  }
]);
