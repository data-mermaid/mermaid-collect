angular.module('app.project').controller('OrphanedProjectsCtrl', [
  '$uibModalInstance',
  '$scope',
  'Button',
  'offlineservice',
  'OfflineTableBackup',
  'orphanedProjects',
  function(
    $uibModalInstance,
    $scope,
    Button,
    offlineservice,
    OfflineTableBackup,
    orphanedProjects
  ) {
    'use strict';

    $scope.modalTitle = 'CLEAN UP UNSYNCHRONIZED DATA';
    $scope.orphanedProjects = orphanedProjects;

    $scope.removeProject = function($event, orphanedProject) {
      const $btn = $($event.target);
      const projectId = orphanedProject.projectId;
      $btn.attr('disabled', 'disabled');
      return OfflineTableBackup.backupProject(projectId)
        .then(function() {
          return offlineservice.deleteProjectDatabases(projectId, true);
        })
        .finally(function() {
          const idx = $scope.orphanedProjects.indexOf(orphanedProject);
          if (idx !== -1) {
            $scope.orphanedProjects.splice(idx, 1);
          }
          $btn.removeAttr('disabled');
          if ($scope.orphanedProjects.length === 0) {
            $uibModalInstance.dismiss('cancel');
          }
        });
    };

    const cancelButton = new Button();
    cancelButton.enabled = true;
    cancelButton.name = 'Cancel';
    cancelButton.classes = 'btn-default';
    cancelButton.click = function() {
      $uibModalInstance.dismiss('cancel');
    };
    $scope.$modalButtons = [cancelButton];
  }
]);
