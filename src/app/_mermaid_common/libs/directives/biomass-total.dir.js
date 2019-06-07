angular.module('mermaid.libs').directive('biomassTotal', [
  '$timeout',
  'offlineservice',
  'TransectService',
  function($timeout, offlineservice, TransectService) {
    'use strict';
    return {
      restrict: 'EA',
      scope: {
        observations: '=',
        transectLenSurveyed: '=',
        transectWidth: '='
      },
      template: '{{ totalBiomass | number : 1 | null_value }}',

      link: function(scope) {
        var timerPromise;
        var calcTotalBiomass = function() {
          if (timerPromise != null) {
            $timeout.cancel(timerPromise);
          }

          timerPromise = $timeout(function() {
            TransectService.calcTotalObsBiomass(
              scope.observations,
              scope.transectLenSurveyed,
              scope.transectWidth
            ).then(function(totalBiomass) {
              scope.totalBiomass = totalBiomass;
            });
          }, 500);
        };

        scope.$watch(
          'observations',
          function() {
            if (scope.observations == null) {
              scope.totalBiomass = null;
              return;
            }
            calcTotalBiomass();
          },
          true
        );

        scope.$watchGroup(['transectLenSurveyed', 'transectWidth'], function(
          newVal
        ) {
          if (newVal[0] == null || newVal[1] == null) {
            scope.totalBiomass = null;
            return;
          }
          calcTotalBiomass();
        });
      }
    };
  }
]);
