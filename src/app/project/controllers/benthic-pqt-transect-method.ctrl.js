angular.module('app.project').controller('BenthicPqtTransectMethodCtrl', [
  '$scope',
  '$rootScope',
  '$state',
  '$stateParams',
  'BENTHIC_PQT_TYPE',
  'blockUI',
  'ConnectivityFactory',
  'Button',
  'ProjectService',
  'benthicAttributes',
  'record',
  'projectProfile',
  'transectLookups',
  function(
    $scope,
    $rootScope,
    $state,
    $stateParams,
    BENTHIC_PQT_TYPE,
    blockUI,
    ConnectivityFactory,
    Button,
    ProjectService,
    benthicAttributes,
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
    $scope.sampleUnit = 'quadrat_transect';
    $scope.choices = transectLookups.choices;
    $scope.project_profiles = transectLookups.project_profiles;
    $scope.record = record;
    Object.defineProperty(benthicAttributes, 'filtered', {
      get() {
        const site = _.get($scope.record, 'data.sample_event.site');
        return ProjectService.filterAttributesBySite(
          benthicAttributes,
          site,
          $scope.choices
        );
      }
    });
    $scope.benthicAttributes = benthicAttributes;
    $scope.protocolSampleUnitDetailsForm =
      'app/project/partials/forms/benthicpqtprotocol.transect.form.tpl.html';
    $scope.protocolObservationsForm =
      'app/project/partials/forms/benthicpqtprotocol.observations.form.tpl.html';

    const editRecord = function() {
      blockUI.start();
      editRecordButton.enabled = false;
      const transect_type = ProjectService.getTransectType(BENTHIC_PQT_TYPE);
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

    conn.on('BenthicPqtTransectMethodCtrl', function(event) {
      editRecordButton.enabled =
        _isRoleDisabled === false && event.event === 'online';
    });
  }
]);