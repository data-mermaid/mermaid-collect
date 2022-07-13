angular
  .module('app.project')
  .controller('HabitatComplexityTransectMethodCtrl', [
    '$scope',
    '$rootScope',
    '$stateParams',
    '$state',
    'HABITAT_COMPLEXITY_TRANSECT_TYPE',
    'blockUI',
    'ConnectivityFactory',
    'Button',
    'ProjectService',
    'TransectService',
    'authService',
    'record',
    'projectProfile',
    'transectLookups',
    function(
      $scope,
      $rootScope,
      $stateParams,
      $state,
      HABITAT_COMPLEXITY_TRANSECT_TYPE,
      blockUI,
      ConnectivityFactory,
      Button,
      ProjectService,
      TransectService,
      authService,
      record,
      projectProfile,
      transectLookups
    ) {
      'use strict';

      const conn = new ConnectivityFactory($scope);
      const project_id = $stateParams.project_id;
      let _isRoleDisabled = ProjectService.isFormDisabled(
        projectProfile,
        ProjectService.ADMIN_ROLE
      );
      $scope.isDisabled = true;
      $scope.sampleUnit = 'benthic_transect';
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

      TransectService.getLookups(project_id).then(function(output) {
        $scope.choices = output.choices;
        $scope.project_profiles = output.project_profiles;
      });

      const editRecord = function() {
        blockUI.start();
        editRecordButton.enabled = false;
        const transect_type = ProjectService.getTransectType(
          HABITAT_COMPLEXITY_TRANSECT_TYPE
        );
        record.data
          .$edit({ project_pk: project_id, id: record.data.id })
          .then(function(response) {
            const collect_record_id = response.id;
            $state
              .go(transect_type.state, {
                id: collect_record_id,
                project_pk: project_id
              })
              .then(function() {
                blockUI.stop();
              });
          })
          .catch(function(err) {
            console.error(err);
            blockUI.stop();
          })
          .finally(function() {
            editRecordButton.enabled = true;
          });
      };

      const editRecordButton = new Button();
      editRecordButton.name = 'Edit Sample Unit - move to Collecting';
      editRecordButton.enabled = !_isRoleDisabled;
      editRecordButton.visible = true;
      editRecordButton.classes = 'btn-success';
      editRecordButton.icon = 'fa fa-save';
      editRecordButton.onlineOnly = true;
      editRecordButton.click = editRecord;
      $scope.save = editRecord;

      $rootScope.PageHeaderButtons = [editRecordButton];

      conn.on('HabitatComplexityTransectMethodCtrl', function(event) {
        editRecordButton.enabled =
          _isRoleDisabled === false && event.event === 'online';
      });
    }
  ]);
