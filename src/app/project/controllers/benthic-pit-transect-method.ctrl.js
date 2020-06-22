angular.module('app.project').controller('BenthicPitTransectMethodCtrl', [
  '$scope',
  '$rootScope',
  '$stateParams',
  'connectivity',
  'ConnectivityFactory',
  'Button',
  'ProjectService',
  'utils',
  'benthicAttributes',
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
    utils,
    benthicAttributes,
    record,
    projectProfile,
    transectLookups
  ) {
    'use strict';

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
    $scope.sampleUnit = record.data.benthic_transect;

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
      'app/project/partials/forms/benthicpitprotocol.transect.form.tpl.html';
    $scope.protocolObservationsForm =
      'app/project/partials/forms/benthicpitprotocol.observations.form.tpl.html';

    const save = function() {
      return $scope.record.data
        .$update({ project_pk: projectId })
        .then(function() {
          utils.assignUniqueId($scope.record.data.obs_benthic_pits);
          utils.showAlert(
            'Success',
            ProjectService.transect_types[2].name + ' Saved',
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
          $scope.record.data.obs_benthic_pits
        );
      },
      function(v) {
        saveButton.enabled = v;
      }
    );

    $scope.$watch('isDisabled', function() {
      saveButton.visible = !$scope.isDisabled;
    });

    conn.on('BenthicPitTransectMethodCtrl', function(event) {
      $scope.isDisabled = _isRoleDisabled || event.event !== 'online';
    });
  }
]);
