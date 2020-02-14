angular.module('app.project').controller('BeltFishTransectMethodCtrl', [
  '$scope',
  '$rootScope',
  'utils',
  'connectivity',
  'ConnectivityFactory',
  '$stateParams',
  'fishAttributes',
  'record',
  'projectProfile',
  'transectLookups',
  'Button',
  'ProjectService',
  function(
    $scope,
    $rootScope,
    utils,
    connectivity,
    ConnectivityFactory,
    $stateParams,
    fishAttributes,
    record,
    projectProfile,
    transectLookups,
    Button,
    ProjectService
  ) {
    'use strict';

    const conn = new ConnectivityFactory($scope);
    const project_id = $stateParams.project_id;
    let _isRoleDisabled = ProjectService.isFormDisabled(
      projectProfile,
      ProjectService.ADMIN_ROLE
    );
    $scope.isDisabled = _isRoleDisabled || !connectivity.isOnline;
    $scope.fishAttributes = fishAttributes;
    $scope.choices = transectLookups.choices;
    $scope.project_profiles = transectLookups.project_profiles;
    $scope.record = record;

    $scope.protocolSampleUnitDetailsForm =
      'app/project/partials/forms/fishbeltprotocol.transect.form.tpl.html';
    $scope.protocolObservationsForm =
      'app/project/partials/forms/fishbeltprotocol.observations.form.tpl.html';

    const save = function() {
      return $scope.record.data
        .$update({ project_pk: project_id })
        .then(function() {
          utils.assignUniqueId($scope.record.data.obs_belt_fishes);
          utils.showAlert(
            'Success',
            ProjectService.transect_types[0].name + ' Saved',
            utils.statuses.success
          );
          $scope.form.$setPristine(true);
        });
    };

    const saveButton = new Button();
    saveButton.name = 'Save';
    saveButton.enabled = false;
    saveButton.visible = true;
    saveButton.classes = 'btn-success';
    saveButton.icon = 'fa fa-save';
    saveButton.onlineOnly = false;
    saveButton.click = save;
    $scope.save = save;

    $rootScope.PageHeaderButtons = [saveButton];

    $scope.$watch(
      function() {
        return (
          $scope.form &&
          $scope.form.$dirty &&
          $scope.form.$valid &&
          $scope.record.data.observers &&
          $scope.record.data.obs_belt_fishes
        );
      },
      function(v) {
        saveButton.enabled = v;
      }
    );

    $scope.$watch('isDisabled', function() {
      saveButton.visible = !$scope.isDisabled;
    });

    conn.on('BeltFishTransectMethodCtrl', function(event) {
      $scope.isDisabled = _isRoleDisabled || event.event !== 'online';
    });
  }
]);
