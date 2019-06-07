angular.module('app.project').controller('ManagementModalCtrl', [
  '$scope',
  '$uibModalInstance',
  'pageContent',
  '$stateParams',
  'offlineservice',
  'ProjectService',
  'ManagementService',
  function(
    $scope,
    $uibModalInstance,
    pageContent,
    $stateParams,
    offlineservice,
    ProjectService,
    ManagementService
  ) {
    'use strict';

    var managementId;
    var saveCallback;
    var projectId = $stateParams.project_id;
    $scope.choices = {};
    $scope.isDisabled = true;

    _.merge($scope, pageContent);

    var loadData = function(projectId, managementId) {
      ProjectService.getMyProjectProfile(projectId).then(function(
        projectProfile
      ) {
        $scope.isDisabled = ProjectService.isFormDisabled(
          projectProfile,
          ProjectService.COLLECTOR_ROLE
        );
      });

      ProjectService.fetchChoices().then(function(choices) {
        $scope.choices = choices;
      });

      ManagementService.fetchData(projectId, managementId).then(function(
        management
      ) {
        $scope.management = management;
      });
    };

    $scope.saveModal = function() {
      ManagementService.save($scope.management)
        .then(function(savedManagement) {
          $uibModalInstance.close(savedManagement);
          saveCallback(savedManagement.id, savedManagement.name);
        })
        .catch(function(err) {
          console.log('err', err);
        });
    };

    $scope.cancelModal = function() {
      $uibModalInstance.dismiss('cancel');
    };

    var un = $scope.$watch('controllerOptions', function() {
      if ($scope.controllerOptions == null) {
        return;
      }
      managementId = $scope.controllerOptions.recordId;
      saveCallback = $scope.controllerOptions.saveCallback;
      loadData(projectId, managementId);
      un();
    });

    $uibModalInstance.rendered.then(function() {
      $scope.loadModalBody($scope);
    });
  }
]);
