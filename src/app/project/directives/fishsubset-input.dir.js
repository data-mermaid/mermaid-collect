angular.module('app.project').directive('fishsubsetInput', [
  'OfflineCommonTables',
  function(OfflineCommonTables) {
    'use strict';
    return {
      require: '^form',
      restrict: 'E',
      scope: {
        project: '='
      },
      templateUrl: 'app/project/directives/fishsubset-input.tpl.html',
      link: function(scope, element, attrs, formCtrl) {
        scope.fishFamilyChoices = null;
        scope.data = { showFishFamilies: false };
        scope.fishFamilyLookup = {};

        const initFishSubsetProperty = function(project) {
          project.data = project.data || {};
          project.data.settings = project.data.settings || {};
          project.data.settings.fishFamilies =
            project.data.settings.fishFamilies || [];
        };

        scope.addFishFamily = function() {
          initFishSubsetProperty(scope.project);

          if (
            scope.project.data.settings.fishFamilies.indexOf(
              scope.data.selectedFishFamily
            ) === -1
          ) {
            scope.project.data.settings.fishFamilies.push(
              scope.data.selectedFishFamily
            );
            scope.project.data.settings.fishFamilies.sort(function(id1, id2) {
              if (
                scope.fishFamilyLookup[id1].name >
                scope.fishFamilyLookup[id2].name
              ) {
                return 1;
              }
              if (
                scope.fishFamilyLookup[id1].name <
                scope.fishFamilyLookup[id2].name
              ) {
                return -1;
              }
              return 0;
            });
          }
          scope.data.selectedFishFamily = null;
        };

        scope.removeFishFamily = function(index) {
          initFishSubsetProperty(scope.project);
          scope.project.data.settings.fishFamilies.splice(index, 1);
          formCtrl.$setDirty();
        };

        OfflineCommonTables.FishFamiliesTable()
          .then(function(table) {
            return table.filter();
          })
          .then(function(fishFamilies) {
            scope.fishFamilyChoices = fishFamilies;
            scope.fishFamilyLookup = {};
            for (let i = 0; i < fishFamilies.length; i++) {
              scope.fishFamilyLookup[fishFamilies[i].id] = fishFamilies[i];
            }
          });

        const unwatch = scope.$watch('project', function() {
          if (scope.project != null) {
            scope.data.showFishFamilies =
              (_.get(scope.project, 'data.settings.fishFamilies') || [])
                .length > 0;
            unwatch();
          }
        });
      }
    };
  }
]);
