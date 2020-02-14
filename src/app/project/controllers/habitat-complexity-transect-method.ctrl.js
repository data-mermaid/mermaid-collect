angular
  .module('app.project')
  .controller('HabitatComplexityTransectMethodCtrl', [
    '$scope',
    '$rootScope',
    '$stateParams',
    'connectivity',
    'ConnectivityFactory',
    'Button',
    'ProjectService',
    'TransectService',
    'authService',
    'utils',
    'record',
    'projectProfile',
    'transectLookups',
    function(
      $scope,
      $rootScope,
      $stateParams,
      connectivity,
      ConnectivityFactory,
      Button,
      ProjectService,
      TransectService,
      authService,
      utils,
      record,
      projectProfile,
      transectLookups
    ) {
      'use strict';
      console.log('habitat transect submit');
      const conn = new ConnectivityFactory($scope);
      const projectId = $stateParams.project_id;
      let _isRoleDisabled = ProjectService.isFormDisabled(
        projectProfile,
        ProjectService.ADMIN_ROLE
      );
      $scope.isDisabled = _isRoleDisabled || !connectivity.isOnline;

      $scope.choices = transectLookups.choices;
      $scope.project_profiles = transectLookups.project_profiles;
      $scope.record = record;
      $scope.protocolSampleUnitDetailsForm =
        'app/project/partials/forms/habitatcomplexityprotocol.transect.form.tpl.html';
      $scope.protocolObservationsForm =
        'app/project/partials/forms/habitatcomplexityprotocol.observations.form.tpl.html';

      authService.getCurrentUser().then(function(currentUser) {
        $scope.currentUser = currentUser;
      });

      TransectService.getLookups(projectId).then(function(output) {
        $scope.choices = output.choices;
        $scope.project_profiles = output.project_profiles;
      });

      const save = function() {
        return $scope.record.data
          .$update({ project_pk: projectId })
          .then(function() {
            utils.assignUniqueId($scope.record.data.obs_habitat_complexities);
            utils.showAlert(
              'Success',
              ProjectService.transect_types[3].name + ' Saved',
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
            $scope.record.data.obs_habitat_complexities
          );
        },
        function(v) {
          saveButton.enabled = v;
        }
      );

      $scope.$watch('isDisabled', function() {
        saveButton.visible = !$scope.isDisabled;
      });

      conn.on('HabitatComplexityTransectMethodCtrl', function(event) {
        $scope.isDisabled = _isRoleDisabled || event.event !== 'online';
      });
    }
  ]);
