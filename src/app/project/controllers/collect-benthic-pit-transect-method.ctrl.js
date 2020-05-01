angular
  .module('app.project')
  .controller('CollectBenthicPitTransectMethodCtrl', [
    '$controller',
    '$scope',
    'ProjectService',
    'BenthicPITWizardConfig',
    'benthicAttributes',
    'collectRecord',
    'currentUser',
    'projectProfile',
    'transectLookups',
    function(
      $controller,
      $scope,
      ProjectService,
      BenthicPITWizardConfig,
      benthicAttributes,
      collectRecord,
      currentUser,
      projectProfile,
      transectLookups
    ) {
      'use strict';

      var $ctrl = this;

      // Need to be set before inheriting
      $ctrl.collectRecord = collectRecord;
      $ctrl.currentUser = currentUser;
      $ctrl.projectProfile = projectProfile;
      $ctrl.transectLookups = transectLookups;
      $ctrl.defaultSchema = {
        data: { benthic_transect: {}, sample_event: {}, interval_size: null }
      };
      //**************************************

      $controller('CollectBaseProtocol', {
        $scope: $scope,
        $ctrl: $ctrl
      });

      $ctrl.state = 'app.project.records.collectbenthicpit';
      $ctrl.protocol = ProjectService.BENTHIC_PIT_TRANSECT_TYPE;
      $scope.wizardConfig = BenthicPITWizardConfig;

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

      $ctrl.init();

      $scope.setDefaultIntervalStart = function() {
        const size = $scope.record.data.interval_size;
        if ($scope.record.data.interval_start == null && size != null) {
          $scope.record.data.interval_start = size;
        }
      };
    }
  ]);
