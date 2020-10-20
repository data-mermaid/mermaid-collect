angular.module('mermaid.libs').directive('legendSlider', [
  'localStorageService',
  function(localStorageService) {
    'use strict';
    return {
      restrict: 'EA',
      templateUrl: 'app/_mermaid_common/libs/directives/legend-slider.tpl.html',
      link: function(scope) {
        scope.toggleNav = true;
        scope.selectAllBenthic = undefined;
        scope.selectAllGeomorphic = undefined;
        scope.benthicColors = {
          'Coral/Algae': 'rgb(255, 97, 97)',
          'Benthic Microalgae': 'rgb(155, 204, 79)',
          Rock: 'rgb(177, 156, 58)',
          Rubble: 'rgb(224, 208, 94)',
          Sand: 'rgb(255, 255, 190)',
          Seagrass: 'rgb(102, 132, 56)'
        };
        scope.geomorphicColors = {
          'Back Reef Slope': 'rgb(190, 251, 255)',
          'Deep Lagoon': 'rgb(44, 162, 249)',
          'Inner Reef Flat': 'rgb(197, 167, 203)',
          'Outer Reef Flat': 'rgb(146, 115, 157)',
          'Patch Reefs': 'rgb(255, 186, 21)',
          Plateau: 'rgb(205, 104, 18)',
          'Reef Crest': 'rgb(97, 66, 114)',
          'Reef Slope': 'rgb(40, 132, 113)',
          'Shallow Lagoon': 'rgb(119, 208, 252)',
          'Sheltered Reef Slope': 'rgb(16, 189, 166)',
          'Small Reef': 'rgb(230, 145, 19)',
          'Terrestrial Reef Flat': 'rgb(251, 222, 251)'
        };
        scope.benthicArray = Object.keys(scope.benthicColors);
        scope.geomorphicArray = Object.keys(scope.geomorphicColors);

        const loadBenthicOptions = function() {
          const benthicStorage =
            localStorageService.get('benthic_legend') || scope.benthicArray;

          return scope.benthicArray.map(value => {
            let updatedBenthic = { name: value, selected: true };

            if (!benthicStorage.includes(value)) {
              updatedBenthic.selected = false;
            }

            return updatedBenthic;
          });
        };

        const loadGeomorphicOptions = function() {
          const geomorphicStorage =
            localStorageService.get('geomorphic_legend') ||
            scope.geomorphicArray;

          return scope.geomorphicArray.map(value => {
            let updatedGeomorphic = { name: value, selected: true };

            if (!geomorphicStorage.includes(value)) {
              updatedGeomorphic.selected = false;
            }

            return updatedGeomorphic;
          });
        };

        const loadCoralMosaicOption = function() {
          const coralStorageOption = localStorageService.get('coral_mosaic');

          if (coralStorageOption === null) {
            return true;
          }

          return coralStorageOption ? true : false;
        };

        scope.benthicOptions = loadBenthicOptions();
        scope.geomorphicOptions = loadGeomorphicOptions();
        scope.selectedCoralMosaic = loadCoralMosaicOption();

        scope.filterBenthic = function(item) {
          let options =
            localStorageService.get('benthic_legend') || scope.benthicArray;

          if (!options.includes(item)) {
            options.push(item);
          } else {
            const index = options.indexOf(item);

            if (index !== -1) {
              options.splice(index, 1);
            }
          }

          localStorageService.set('benthic_legend', options);
        };

        scope.filterGeomorphic = function(item) {
          let options =
            localStorageService.get('geomorphic_legend') ||
            scope.geomorphicArray;

          if (!options.includes(item)) {
            options.push(item);
          } else {
            const index = options.indexOf(item);

            if (index !== -1) {
              options.splice(index, 1);
            }
          }

          localStorageService.set('geomorphic_legend', options);
        };

        scope.filterCoralMosaic = function() {
          const result = scope.selectedCoralMosaic ? 1 : 0;
          localStorageService.set('coral_mosaic', result);
        };

        scope.filterAll = function() {
          if (scope.selectAllBenthic) {
            const allBenthicStorage = scope.benthicOptions.map(
              benthic => benthic.name
            );
            scope.benthicOptions.forEach(item => (item.selected = true));

            localStorageService.set('benthic_legend', allBenthicStorage);
          } else {
            scope.benthicOptions.forEach(item => (item.selected = false));
            localStorageService.set('benthic_legend', []);
          }
        };

        scope.filterAllGeomorphic = function() {
          if (scope.selectAllGeomorphic) {
            const allGeomorphicStorage = scope.geomorphicOptions.map(
              geomorphic => geomorphic.name
            );
            scope.geomorphicOptions.forEach(item => (item.selected = true));

            localStorageService.set('geomorphic_legend', allGeomorphicStorage);
          } else {
            scope.geomorphicOptions.forEach(item => (item.selected = false));
            localStorageService.set('geomorphic_legend', []);
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

        scope.$watch(
          'geomorphicOptions',
          function(geomorphics) {
            const selectGeomorphic = geomorphics.reduce((totalTruth, value) => {
              if (value.selected) {
                totalTruth += 1;
              }
              return totalTruth;
            }, 0);

            scope.selectAllGeomorphic = selectGeomorphic === geomorphics.length;
          },
          true
        );
      }
    };
  }
]);
