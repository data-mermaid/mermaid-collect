angular.module('app.project').directive('obsHabitatComplexityList', [
  'offlineservice',
  'utils',
  '$timeout',
  'TransectService',
  'ValidatorService',
  function(offlineservice, utils, $timeout, TransectService, ValidatorService) {
    'use strict';
    return {
      restrict: 'EA',
      require: '^form',
      scope: {
        obsHabitatComplexitys: '=',
        transectLengthSurveyed: '=',
        intervalSize: '=',
        isDisabled: '=?'
      },
      templateUrl:
        'app/project/directives/obs-habitat-complexity/obs-habitat-complexity-list.tpl.html',
      link: function(scope, element, attrs, formCtrl) {
        const $table = $(element).find('table');
        scope.isDisabled = utils.truthy(scope.isDisabled);
        scope.choices = {};
        scope.editableObservationIndex = null;
        scope.validator = ValidatorService;

        const getRowIndex = function($index) {
          return $index == null
            ? scope.obsHabitatComplexitys.length - 1
            : $index;
        };

        const setInputFocus = function(rowIndex, cellIndex) {
          $timeout(function() {
            const $elm = $($table.find('tbody tr')[rowIndex]);
            $($elm.find('select, input')[cellIndex])
              .focus()
              .select();
          }, 30);
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

          scope.obsHabitatComplexitys = scope.obsHabitatComplexitys || [];
          const nextIndex = getRowIndex($index) + 1;
          let nextCol = 'score';
          let newRecord = {}; // simple add row

          if (
            !$event ||
            ($event.keyCode === 13 ||
              (!$event.shiftKey && $event.keyCode === 9))
          ) {
            if ($event && $event.keyCode === 9) {
              // if comma, duplicate row and focus on val
              nextCol = 'interval';
              newRecord = _.omit(scope.obsHabitatComplexitys[$index], [
                'id',
                '$$hashKey',
                nextCol,
                '$$uid'
              ]);
            }

            scope.obsHabitatComplexitys.splice(nextIndex, 0, newRecord);
            formCtrl.$setDirty();
            scope.startEditing(null, nextIndex);

            setInputFocus(nextIndex, 0);
          }
        };

        scope.deleteRow = function(observation) {
          if (scope.isDisabled === true) {
            return;
          }

          scope.obsHabitatComplexitys = scope.obsHabitatComplexitys || [];
          const idx = scope.obsHabitatComplexitys.indexOf(observation);
          if (idx !== -1) {
            scope.obsHabitatComplexitys.splice(idx, 1);
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
          if (evt.target.classList.contains('addRow')) {
            return;
          }
          scope.stopEditing();
        });

        scope.$watch(
          'obsHabitatComplexitys',
          function(newVal, oldVal) {
            if (newVal == null || newVal === oldVal) {
              return;
            }

            TransectService.setObservationIntervals(
              scope.obsHabitatComplexitys,
              scope.intervalSize
            );
          },
          true
        );

        scope.$watch(
          'intervalSize',
          function(newVal, oldVal) {
            if (newVal == null || newVal === oldVal) {
              return;
            }

            TransectService.setObservationIntervals(
              scope.obsHabitatComplexitys,
              scope.intervalSize
            );
          },
          true
        );
      }
    };
  }
]);
