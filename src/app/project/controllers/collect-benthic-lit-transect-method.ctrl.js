angular
  .module('app.project')
  .controller('CollectBenthicLitTransectMethodCtrl', [
    'BENTHIC_LIT_TRANSECT_TYPE',
    '$controller',
    '$scope',
    'ProjectService',
    'BenthicLITWizardConfig',
    'benthicAttributes',
    'collectRecord',
    'currentUser',
    'projectProfile',
    'transectLookups',
    function(
      BENTHIC_LIT_TRANSECT_TYPE,
      $controller,
      $scope,
      ProjectService,
      BenthicLITWizardConfig,
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
        data: { benthic_transect: {}, sample_event: {} }
      };
      //**************************************

      $controller('CollectBaseProtocol', {
        $scope: $scope,
        $ctrl: $ctrl
      });

      $ctrl.state = 'app.project.records.collectbenthiclit';
      $ctrl.protocol = BENTHIC_LIT_TRANSECT_TYPE;
      $scope.wizardConfig = BenthicLITWizardConfig;
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
        'app/project/partials/forms/benthiclitprotocol.transect.form.tpl.html';
      $scope.protocolObservationsForm =
        'app/project/partials/forms/benthiclitprotocol.observations.form.tpl.html';

      $ctrl.init();
    }
  ]);
