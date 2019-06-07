angular.module('app.project').directive('obsHabitatComplexityList', [
  'offlineservice',
  'utils',
  '$timeout',
  '$window',
  'TransectService',
  function(offlineservice, utils, $timeout, $window, TransectService) {
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
        var $table = $(element).find('table');
        scope.isDisabled = utils.truthy(scope.isDisabled);
        scope.choices = {};

        offlineservice.ChoicesTable(true).then(function(table) {
          return table.filter().then(function(choices) {
            _.each(choices, function(c) {
              scope.choices[c.name] = c.data;
            });
          });
        });

        scope.getNextIndex = function(obs) {
          var index = scope.obsHabitatComplexitys.indexOf(obs);
          return _.parseInt(index) + 1 || scope.obsHabitatComplexitys.length;
        };

        scope.displayInterval = function(interval) {
          return interval ? interval + 'm' : '';
        };

        scope.addRow = function($event, observation) {
          if (scope.isDisabled === true) {
            return;
          }

          scope.obsHabitatComplexitys = scope.obsHabitatComplexitys || [];
          // The comma causes the benthic attribute to be
          // cleared, need to keep track of it.
          var benthicAttribute = observation ? observation.attribute : null;
          var nextIndex = scope.getNextIndex(observation);
          var nextCol = 'score';
          var newRecord = {}; // simple add row

          if (
            !$event ||
            ($event.keyCode === 13 ||
              (!$event.shiftKey && $event.keyCode === 9))
          ) {
            if ($event && $event.keyCode === 9) {
              // if comma, duplicate row and focus on val
              nextCol = 'interval';
              newRecord = _.omit(observation, [
                'id',
                '$$hashKey',
                nextCol,
                '$$uid'
              ]);
            }

            utils.assignUniqueId(newRecord);
            scope.obsHabitatComplexitys.splice(nextIndex, 0, newRecord);

            $timeout(function() {
              if (observation) {
                observation.attribute = benthicAttribute;
              }
              var $elm = $($table.find('tr')[nextIndex + 1]);
              $($elm.find('input')[0]).focus();
            }, 0);
          }
        };

        scope.deleteRow = function(observation) {
          if (scope.isDisabled === true) {
            return;
          }

          scope.obsHabitatComplexitys = scope.obsHabitatComplexitys || [];
          var idx = scope.obsHabitatComplexitys.indexOf(observation);
          if (idx !== -1) {
            scope.obsHabitatComplexitys.splice(idx, 1);
          }
          formCtrl.$setDirty();
        };

        scope.$watch(
          'obsHabitatComplexitys',
          function(newVal, oldVal) {
            if (newVal == null || newVal === oldVal) {
              return;
            }

            utils.assignUniqueId(scope.obsBenthicLits);
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
