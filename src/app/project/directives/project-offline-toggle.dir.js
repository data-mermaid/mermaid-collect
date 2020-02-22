angular.module('app.project').directive('projectOfflineToggle', [
  '$timeout',
  'OfflineTableUtils',
  'OfflineTables',
  'ProjectService',
  function($timeout, OfflineTableUtils, OfflineTables, ProjectService) {
    'use strict';
    return {
      restrict: 'E',
      scope: {
        projectId: '='
      },
      templateUrl: 'app/project/directives/project-offline-toggle.tpl.html',
      link: function(scope) {
        scope.isDisabled = false;
        scope.isAvailableOffline = null;
        scope.messages = {
          true: 'Project is available for working offline',
          false: 'Project is not available for working offline'
        };

        scope.toggleOffline = function() {
          if (scope.isDisabled) {
            return;
          }
          scope.isDisabled = true;
          var promise;
          if (scope.isAvailableOffline) {
            promise = OfflineTables.deleteProjectDatabases(
              scope.projectId,
              false,
              true
            );
          } else {
            promise = ProjectService.loadProject(scope.projectId);
          }
          return promise
            .then(function() {
              scope.isAvailableOffline = !scope.isAvailableOffline;
              $timeout(function() {
                ProjectService.isProjectOffline(scope.projectId).then(function(
                  isOffline
                ) {
                  scope.isAvailableOffline = isOffline;
                });
              }, 1000);
            })
            .finally(function() {
              scope.isDisabled = false;
            });
        };

        ProjectService.isProjectOffline(scope.projectId).then(function(
          isOffline
        ) {
          scope.isAvailableOffline = isOffline;
        });
      }
    };
  }
]);
