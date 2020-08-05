angular.module('mermaid.libs').directive('abundanceTotal', [
  'TransectService',
  function(TransectService) {
    'use strict';
    return {
      restrict: 'EA',
      scope: {
        observations: '='
      },
      template: '{{ totalAbundance | number: 0 | null_value }}',

      link: function(scope) {
        const calcTotalAbundance = function() {
          scope.totalAbundance = TransectService.calcTotalAbundance(
            scope.observations
          );
        };

        scope.$watch(
          'observations',
          function() {
            if (scope.observations === null) {
              scope.totalAbundance = null;
              return;
            }
            calcTotalAbundance();
          },
          true
        );
      }
    };
  }
]);
