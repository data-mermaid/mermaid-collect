angular.module('mermaid.libs').directive('biomass', [
  'OfflineCommonTables',
  'TransectService',
  function(OfflineCommonTables, TransectService) {
    'use strict';
    return {
      restrict: 'EA',
      scope: {
        obs: '=',
        biomassval: '=?',
        transectLenSurveyed: '=?',
        transectWidth: '=?'
      },
      template: '{{ biomassval | number : 1 | null_value }}',

      link: function(scope) {
        let fishattribute;

        const _update_biomass = function() {
          const size =
            Number.isFinite(scope.obs.size) &&
            !(scope.obs.alt_size === 50 && scope.obs.size < 50)
              ? scope.obs.size
              : null;

          const count = Number.isFinite(scope.obs.count)
            ? scope.obs.count
            : null;

          const constant_a = Number.isFinite(fishattribute.biomass_constant_a)
            ? fishattribute.biomass_constant_a
            : null;

          const constant_b = Number.isFinite(fishattribute.biomass_constant_b)
            ? fishattribute.biomass_constant_b
            : null;

          const constant_c = Number.isFinite(fishattribute.biomass_constant_c)
            ? fishattribute.biomass_constant_c
            : null;

          const length = Number.isFinite(scope.transectLenSurveyed)
            ? scope.transectLenSurveyed
            : null;

          const width =
            scope.transectWidth != null
              ? TransectService.getBeltFishWidthVal(
                  size,
                  scope.transectWidth.conditions
                )
              : null;

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

        const watch_biomass_inputs = function() {
          if (
            angular.isDefined(fishattribute) &&
            fishattribute !== null &&
            fishattribute.id == scope.obs.fish_attribute
          ) {
            _update_biomass();
          } else {
            OfflineCommonTables.FishAttributesTable(true).then(function(table) {
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
