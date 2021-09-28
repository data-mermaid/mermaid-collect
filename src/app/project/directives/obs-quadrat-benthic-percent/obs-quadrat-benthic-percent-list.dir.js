angular.module('app.project').directive('obsQuadratBenthicPercentList', [
  'utils',
  '$timeout',
  'ValidatorService',
  function(utils, $timeout, ValidatorService) {
    'use strict';
    return {
      restrict: 'E',
      require: '^form',
      scope: {
        obsQuadratBenthicPercent: '=',
        isDisabled: '=?'
      },
      templateUrl:
        'app/project/directives/obs-quadrat-benthic-percent/obs-quadrat-benthic-percent-list.tpl.html',
      link: function(scope, element, attrs, formCtrl) {
        scope.isReady = false;
        utils.assignUniqueId(scope.obsQuadratBenthicPercent);
        scope.isReady = true;

        scope.rowError = {};
        scope.isDisabled = utils.truthy(scope.isDisabled);
        scope.choices = {};
        scope.editableObservationIndex = null;

        const getRowIndex = function($index) {
          return $index == null
            ? scope.obsQuadratBenthicPercent.length - 1
            : $index;
        };

        const setInputFocus = function(rowIndex, cellIndex) {
          $timeout(function() {
            const $elm = $($(element).find('table tbody tr')[rowIndex]);
            $($elm.find('select, input')[cellIndex])
              .focus()
              .select();
          }, 30);
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
          $event.stopPropagation();
        };

        scope.addRow = function($event, $index) {
          if (scope.isDisabled === true) {
            return;
          }
          scope.obsQuadratBenthicPercent = scope.obsQuadratBenthicPercent || [];
          const nextIndex = getRowIndex($index) + 1;
          const newRecord = {
            percent_hard: null,
            percent_soft: null,
            percent_algae: null
          };

          newRecord.$$uid = utils.generateUuid();
          scope.obsQuadratBenthicPercent.splice(nextIndex, 0, newRecord);
          formCtrl.$setDirty();
          scope.startEditing(null, nextIndex);
          setInputFocus(nextIndex, 0);
        };

        scope.deleteRow = function(observation) {
          if (scope.isDisabled === true) {
            return;
          }
          scope.obsQuadratBenthicPercent = scope.obsQuadratBenthicPercent || [];
          const idx = scope.obsQuadratBenthicPercent.indexOf(observation);
          if (idx !== -1) {
            scope.obsQuadratBenthicPercent.splice(idx, 1);
          }
          formCtrl.$setDirty();
        };

        scope.validateRow = function(obs, $index) {
          const totalPercent = utils.safe_sum(
            obs.percent_hard,
            obs.percent_soft,
            obs.percent_algae
          );

          if (totalPercent > 100) {
            scope.rowError[$index] = true;
          } else {
            scope.rowError[$index] = false;
          }
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

        $(window).click(function() {
          scope.stopEditing();
        });

        scope.validateCountInput = function(val) {
          const valueExists = ValidatorService.requiresvalue(val);
          const isNotMinValue = ValidatorService.minvalue(val, 0, true);
          const isGreaterThanValue = ValidatorService.maxvalue(val, 100, true);
          const isInteger = ValidatorService.integervalue(val);
          return [
            { isValid: valueExists, message: 'Required' },
            { isValid: isNotMinValue, message: 'Value must be greater than 0' },
            {
              isValid: isGreaterThanValue,
              message: 'Value must be less than or equal to 100'
            },
            { isValid: isInteger, message: 'Value must be a whole number' }
          ];
        };

        if (scope.obsQuadratBenthicPercent) {
          for (let i = 0; i < scope.obsQuadratBenthicPercent.length; i++) {
            scope.validateRow(scope.obsQuadratBenthicPercent[i], i);
          }
        }
      }
    };
  }
]);
