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
  'project',
  'choices',
  'management',
  'projectProfile',
  function(
    $rootScope,
    $scope,
    $state,
    $stateParams,
    ProjectService,
    ManagementService,
    Button,
    logger,
    utils,
    project,
    choices,
    management,
    projectProfile
  ) {
    'use strict';

    const projectId = $stateParams.project_id;

    $scope.isDisabled = ProjectService.isFormDisabled(
      projectProfile,
      ProjectService.COLLECTOR_ROLE
    );
    $scope.management = management;
    $scope.choices = choices;

    const save = function() {
      const isNew = $scope.management.id == null;
      ManagementService.save($scope.management, { projectId: projectId })
        .then(function(savedManagement) {
          if (isNew) {
            const params = {
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
          project.update();
        })
        .catch(function(error) {
          logger.error('save_management', error);
          utils.errorAlert(error);
          return error;
        });
    };

    // GLOBAL BUTTONS
    const saveButton = new Button();
    saveButton.name = 'Save';
    saveButton.enabled = true;
    saveButton.visible = true;
    saveButton.classes = 'btn-success';
    saveButton.icon = 'fa fa-save';
    saveButton.click = save;
    saveButton.onlineOnly = false;
    $scope.save = save;

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
