angular.module('mermaid.libs').directive('biomass', [
  'offlineservice',
  'TransectService',
  function(offlineservice, TransectService) {
    'use strict';
    return {
      restrict: 'EA',
      scope: {
        obs: '=',
        biomassval: '=?',
        transectLenSurveyed: '=?',
        transectWidth: '=?'
      },
      template: '{{ biomassval | number : 1 }}',

      link: function(scope) {
        var fishattribute;
        var constant_a = null;
        var constant_b = null;
        var constant_c = null;
        var width = null;
        var length = null;

        var _update_biomass = function() {
          var size = Number.isFinite(scope.obs.size) ? scope.obs.size : null;
          var count = Number.isFinite(scope.obs.count) ? scope.obs.count : null;
          if (Number.isFinite(fishattribute.biomass_constant_a)) {
            constant_a = fishattribute.biomass_constant_a;
          }

          if (Number.isFinite(fishattribute.biomass_constant_b)) {
            constant_b = fishattribute.biomass_constant_b;
          }

          if (Number.isFinite(fishattribute.biomass_constant_c)) {
            constant_c = fishattribute.biomass_constant_c;
          }

          if (Number.isFinite(scope.transectLenSurveyed)) {
            length = scope.transectLenSurveyed;
          }

          if (scope.transectWidth != null) {
            width = TransectService.getBeltFishWidthVal(
              size,
              scope.transectWidth.conditions
            );
          }

          scope.biomassval = TransectService.calcObsBiomass(
            size,
            count,
            constant_a,
            constant_b,
            constant_c,
            length,
            width
          );
        };

        var watch_biomass_inputs = function() {
          if (
            angular.isDefined(fishattribute) &&
            fishattribute !== null &&
            fishattribute.id == scope.obs.fish_attribute
          ) {
            _update_biomass();
          } else {
            offlineservice.FishAttributesTable(true).then(function(table) {
              if (angular.isDefined(scope.obs.fish_attribute)) {
                table.get(scope.obs.fish_attribute).then(function(fa) {
                  if (fa !== null) {
                    fishattribute = fa;
                    _update_biomass();
                  }
                });
              }
            });
          }
        };

        scope.$watch('obs', watch_biomass_inputs, true);
        scope.$watchGroup(
          ['transectLenSurveyed', 'transectWidth'],
          watch_biomass_inputs
        );
      }
    };
  }
]);
