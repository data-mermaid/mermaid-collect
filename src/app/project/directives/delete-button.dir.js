angular.module('app.project').directive('deleteButton', [
  'utils',
  '$state',
  'ProjectService',
  '$stateParams',
  'OfflineTableUtils',
  function(utils, $state, ProjectService, $stateParams, OfflineTableUtils) {
    'use strict';

    return {
      restrict: 'EA',
      scope: {
        record: '=',
        isDisabled: '=',
        state: '='
      },
      templateUrl: 'app/project/directives/delete-button.tpl.html',
      link: function(scope) {
        const projectId = $stateParams.project_id;
        scope.isAdmin = false;

        ProjectService.getMyProjectProfile(projectId).then(function(
          project_profile
        ) {
          scope.isAdmin = project_profile.is_admin;
        });

        scope.deleteRecord = function() {
          utils.showConfirmation(
            function() {
              var promise;
              if (scope.record.data && scope.record.data.$delete) {
                // Transect
                scope.record.data.project_pk =
                  scope.record.data.project_pk || projectId;
                promise = scope.record.data.$delete();
              } else if (scope.record && scope.record.$delete) {
                promise = scope.record.$delete();
              } else {
                promise = scope.record.delete();
              }
              return promise.then(function() {
                $state.go(scope.state);
                OfflineTableUtils.ProjectsTable().then(function(table) {
                  return table.get(projectId).then(function(record) {
                    return record.update();
                  });
                });
              });
            },
            'Warning',
            utils.template('Are you sure? There is NO undo!')
          );
        };
      }
    };
  }
]);
