angular.module('app.project').directive('obsBeltFishSummary', [
  'TransectService',
  function(TransectService) {
    'use strict';
    return {
      restrict: 'E',
      scope: {
        observations: '=',
        transectLenSurveyed: '=?',
        transectWidth: '=?'
      },
      templateUrl:
        'app/project/directives/obs-belt-fish/obs-belt-fish-summary.tpl.html',
      link: function(scope) {
        scope.widthValueLookup = {};
        TransectService.getWidthValueLookup().then(function(lookup) {
          scope.widthValueLookup = lookup;
        });
      }
    };
  }
]);
