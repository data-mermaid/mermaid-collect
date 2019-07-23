angular.module('app.project').directive('obsBenthicPitSummary', [
  '$timeout',
  'TransectService',
  function($timeout, TransectService) {
    'use strict';
    return {
      restrict: 'E',
      scope: {
        obsBenthicPits: '=',
        benthicAttributesLookup: '='
      },
      templateUrl:
        'app/project/directives/obs-benthic-pit/obs-benthic-pit-summary.tpl.html',
      link: function(scope) {
        let watchTimeoutPromise = null;
        scope.observation_calcs = [];

        const calcSummary = function(obs) {
          $timeout.cancel(watchTimeoutPromise);
          watchTimeoutPromise = $timeout(function() {
            console.log(
              'scope.benthicAttributesLookup',
              scope.benthicAttributesLookup
            );

            scope.observation_calcs = TransectService.calcBenthicPercentages(
              obs,
              scope.benthicAttributesLookup
            );
          }, 300);
        };

        scope.$watch(
          'obsBenthicPits',
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
