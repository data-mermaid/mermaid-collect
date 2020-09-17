angular.module('app.project').directive('fishgroupingInput', [
  'OfflineCommonTables',
  function(OfflineCommonTables) {
    'use strict';
    return {
      restrict: 'E',
      scope: {
        record: '='
      },
      templateUrl: 'app/project/directives/fishgrouping-input.tpl.html',
      link: function(scope) {
        scope.fishFamilyChoices = null;
        scope.data = {};
        scope.fishFamilyLookup = {};

        scope.addFishFamily = function() {
          scope.record.fishFamilies = scope.record.fishFamilies || [];
          if (
            scope.record.fishFamilies.indexOf(scope.data.selectedFishFamily) ===
            -1
          ) {
            scope.record.fishFamilies.push(scope.data.selectedFishFamily);
          }
          scope.data.selectedFishFamily = null;
        };

        scope.removeFishFamily = function(index) {
          scope.record.fishFamilies = scope.record.fishFamilies || [];
          scope.record.fishFamilies.splice(index, 1);
        };

        OfflineCommonTables.FishFamiliesTable()
          .then(function(table) {
            return table.filter();
          })
          .then(function(fishFamilies) {
            scope.fishFamilyChoices = fishFamilies;
            scope.fishFamilyLookup = _.reduce(fishFamilies, function(
              obj,
              fishFamily
            ) {
              obj[fishFamily.id] = fishFamily;
              return obj;
            });
          });
      }
    };
  }
]);
