angular.module('app.project').controller('ManagementCtrl', [
  '$rootScope',
  '$scope',
  '$state',
  '$stateParams',
  'ProjectService',
  'ManagementService',
  'Button',
  'logger',
  'utils',
  function(
    $rootScope,
    $scope,
    $state,
    $stateParams,
    ProjectService,
    ManagementService,
    Button,
    logger,
    utils
  ) {
    'use strict';

    var managementId = $stateParams.id;
    var projectId = $stateParams.project_id;
    $scope.choices = {};
    $scope.isDisabled = true;

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

    $scope.save = function() {
      var isNew = $scope.management.id == null;
      ManagementService.save($scope.management, { projectId: projectId })
        .then(function(savedManagement) {
          if (isNew) {
            var params = {
              project_pk: projectId,
              id: savedManagement.id
            };
            $scope.management = savedManagement;
            $scope.form.$setPristine(true);
            $state.transitionTo('app.project.managements.management', params, {
              location: true,
              inherit: true,
              relative: $state.$current,
              notify: false
            });
          }
          $scope.form.$setPristine(true);
        })
        .catch(function(error) {
          logger.error('save_management', error);
          utils.errorAlert(error);
          return error;
        });
    };

    // GLOBAL BUTTONS
    var saveButton = new Button();
    saveButton.name = 'Save';
    saveButton.enabled = true;
    saveButton.visible = true;
    saveButton.classes = 'btn-success';
    saveButton.icon = 'fa fa-save';
    saveButton.click = $scope.save;
    saveButton.onlineOnly = false;

    $rootScope.PageHeaderButtons = [saveButton];

    $scope.$watch(
      function() {
        return $scope.form && $scope.form.$dirty && $scope.form.$valid;
      },
      function(v) {
        saveButton.enabled = v && !$scope.isDisabled;
      }
    );
  }
]);
