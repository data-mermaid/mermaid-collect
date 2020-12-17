angular
  .module('app.project')
  .controller('CollectHabitatComplexityTransectMethodCtrl', [
    'HABITAT_COMPLEXITY_TRANSECT_TYPE',
    '$controller',
    '$scope',
    'ProjectService',
    'HabitatComplexityWizardConfig',
    'collectRecord',
    'currentUser',
    'projectProfile',
    'transectLookups',
    function(
      HABITAT_COMPLEXITY_TRANSECT_TYPE,
      $controller,
      $scope,
      ProjectService,
      HabitatComplexityWizardConfig,
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
        data: { benthic_transect: {}, sample_event: {} }
      };
      //**************************************

      $controller('CollectBaseProtocol', {
        $scope: $scope,
        $ctrl: $ctrl
      });

      $ctrl.state = 'app.project.records.collecthabitatcomplexity';
      $ctrl.protocol = HABITAT_COMPLEXITY_TRANSECT_TYPE;
      $scope.wizardConfig = HabitatComplexityWizardConfig;
      $scope.protocolSampleUnitDetailsForm =
        'app/project/partials/forms/habitatcomplexityprotocol.transect.form.tpl.html';
      $scope.protocolObservationsForm =
        'app/project/partials/forms/habitatcomplexityprotocol.observations.form.tpl.html';

      $ctrl.init();
    }
  ]);
