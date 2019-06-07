angular.module('app.project').directive('obsQuadratBenthicPercentSummary', [
  'utils',
  function(utils) {
    'use strict';
    return {
      restrict: 'E',
      scope: {
        obsQuadratBenthicPercent: '='
      },
      templateUrl:
        'app/project/directives/obs-quadrat-benthic-percent/obs-quadrat-benthic-percent-summary.tpl.html',
      link: function(scope) {
        scope.num_quadrats = null;
        scope.avg_hard_coral = null;
        scope.avg_soft_coral = null;
        scope.avg_macroalgae = null;

        const calcSummary = function(obs) {
          scope.num_quadrats = obs.length;

          scope.avg_hard_coral = utils.safe_division(
            utils.safe_sum.apply(this, _.map(obs, 'percent_hard')),
            scope.num_quadrats
          );
          scope.avg_soft_coral = utils.safe_division(
            utils.safe_sum.apply(this, _.map(obs, 'percent_soft')),
            scope.num_quadrats
          );
          scope.avg_macroalgae = utils.safe_division(
            utils.safe_sum.apply(this, _.map(obs, 'percent_algae')),
            scope.num_quadrats
          );
        };

        scope.$watch(
          'obsQuadratBenthicPercent',
          function(obs) {
            obs = obs || [];
            calcSummary(obs);
          },
          true
        );
      }
    };
  }
]);
