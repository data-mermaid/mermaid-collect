angular.module('app.project').directive('obsBenthicSummary', [
  '$timeout',
  'TransectService',
  function($timeout, TransectService) {
    'use strict';
    return {
      restrict: 'E',
      scope: {
        observations: '=',
        benthicAttributesLookup: '=',
        lengthAttr: '@'
      },
      templateUrl: 'app/project/directives/obs-benthic-summary.tpl.html',
      link: function(scope) {
        let watchTimeoutPromise = null;
        scope.observation_calcs = [];

        const calcSummary = function(obs) {
          $timeout.cancel(watchTimeoutPromise);
          watchTimeoutPromise = $timeout(function() {
            scope.observation_calcs = TransectService.calcBenthicPercentages(
              obs,
              scope.benthicAttributesLookup,
              scope.lengthAttr
            );
          }, 300);
        };

        scope.$watch(
          'observations',
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
