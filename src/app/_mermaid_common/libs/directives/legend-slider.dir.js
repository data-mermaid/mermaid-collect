angular.module('mermaid.libs').directive('legendSlider', [
  function() {
    'use strict';
    return {
      restrict: 'EA',
      scope: {},
      templateUrl: 'app/_mermaid_common/libs/directives/legend-slider.tpl.html',
      link: function(scope) {
        scope.toggleNav = false;
        scope.benthicOptions = [];
        scope.selectAllBenthic = undefined;
        scope.benthicColors = scope.$parent.benthicLayerColors;

        scope.filterLegend = function(item) {
          let options = JSON.parse(localStorage.getItem('benthic_legend'));

          if (!options.includes(item)) {
            options.push(item);
          } else {
            const index = options.indexOf(item);

            if (index !== -1) {
              options.splice(index, 1);
            }
          }

          localStorage.setItem('benthic_legend', JSON.stringify(options));
        };

        scope.filterAll = function() {
          if (scope.selectAllBenthic) {
            const allBenthicStorage = scope.benthicOptions.map(
              benthic => benthic.name
            );
            scope.benthicOptions.forEach(item => (item.selected = true));

            localStorage.setItem(
              'benthic_legend',
              JSON.stringify(allBenthicStorage)
            );
          } else {
            scope.benthicOptions.forEach(item => (item.selected = false));
            localStorage.setItem('benthic_legend', JSON.stringify([]));
          }
        };

        scope.$watch(
          'benthicOptions',
          function(benthics) {
            const selectBenthic = benthics.reduce((totalTruth, value) => {
              if (value.selected) {
                totalTruth += 1;
              }
              return totalTruth;
            }, 0);

            scope.selectAllBenthic = selectBenthic === benthics.length;
          },
          true
        );

        scope.$watch('$parent.benthicLegends', function(v) {
          if (v !== undefined) {
            if (localStorage.getItem('benthic_legend') === null) {
              const initialOptions = v.map(value => {
                return {
                  name: value,
                  selected: true
                };
              });

              scope.benthicOptions = initialOptions;
              scope.selectAllBenthic = true;
              localStorage.setItem('benthic_legend', JSON.stringify(v));
            } else {
              const benthicStorage = JSON.parse(
                localStorage.getItem('benthic_legend')
              );

              const storageOption = v.map(value => {
                let updatedBenthic = { name: value, selected: true };

                if (!benthicStorage.includes(value)) {
                  updatedBenthic.selected = false;
                }

                return updatedBenthic;
              });
              scope.benthicOptions = [...storageOption];
            }
          }
        });
      }
    };
  }
]);
