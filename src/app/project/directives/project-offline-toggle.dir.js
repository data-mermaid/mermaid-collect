angular.module('app.project').directive('projectOfflineToggle', [
  'OfflineTableUtils',
  'ProjectService',
  function(OfflineTableUtils, ProjectService) {
    'use strict';
    return {
      restrict: 'E',
      scope: {
        projectId: '='
      },
      templateUrl: 'app/project/directives/project-offline-toggle.tpl.html',
      link: function(scope) {
        scope.isAvailableOffline = false;
        scope.messages = {
          true: 'Project is available for working offline',
          false: 'Project is not available for working offline'
        };

        scope.toggleOffline = function() {
          var promise;
          if (scope.isAvailableOffline) {
            promise = OfflineTableUtils.clearDatabases(scope.projectId);
          } else {
            promise = ProjectService.loadProject(scope.projectId);
          }
          promise.then(function() {
            OfflineTableUtils.isProjectOffline(scope.projectId).then(function(
              isOffline
            ) {
              scope.isAvailableOffline = isOffline;
            });
          });
        };

        scope.$watch('projectId', function() {
          if (scope.projectId == null) {
            scope.isProjectOffline = false;
            return;
          }
          OfflineTableUtils.isProjectOffline(scope.projectId).then(function(
            isOffline
          ) {
            scope.isAvailableOffline = isOffline;
          });
        });
      }
    };
  }
]);
