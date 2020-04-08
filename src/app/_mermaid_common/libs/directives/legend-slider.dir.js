angular.module('mermaid.libs').directive('legendSlider', [
  function() {
    'use strict';
    return {
      restrict: 'EA',
      scope: {},
      templateUrl: 'app/_mermaid_common/libs/directives/legend-slider.tpl.html',
      link: function(scope) {
        scope.toggleNav = false;
        scope.selectAllBenthic = undefined;
        scope.benthicColors = scope.$parent.benthicLayerColors;
        scope.benthicArray = Object.keys(scope.benthicColors);

        const loadBenthicOptions = function() {
          const benthicStorage =
            JSON.parse(localStorage.getItem('benthic_legend')) ||
            scope.benthicArray;

          return scope.benthicArray.map(value => {
            let updatedBenthic = { name: value, selected: true };

            if (!benthicStorage.includes(value)) {
              updatedBenthic.selected = false;
            }

            return updatedBenthic;
          });
        };

        const loadCoralMosaicOption = function() {
          const coralStorageOption = JSON.parse(
            localStorage.getItem('coral_mosaic')
          );

          if (coralStorageOption === null) {
            return true;
          }

          return coralStorageOption ? true : false;
        };

        scope.benthicOptions = loadBenthicOptions();
        scope.selectedCoralMosaic = loadCoralMosaicOption();

        scope.filterBenthic = function(item) {
          let options =
            JSON.parse(localStorage.getItem('benthic_legend')) ||
            scope.benthicArray;

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

        scope.filterCoralMosaic = function() {
          const result = scope.selectedCoralMosaic ? 1 : 0;
          localStorage.setItem('coral_mosaic', result);
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
      }
    };
  }
]);
