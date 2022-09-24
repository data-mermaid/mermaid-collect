angular
  .module('app.project')
  .controller('CollectBenthicPQTTransectMethodCtrl', [
    'BENTHIC_PQT_TYPE',
    '$controller',
    '$scope',
    'ProjectService',
    'BenthicPQTWizardConfig',
    'benthicAttributes',
    'collectRecord',
    'currentUser',
    'projectProfile',
    'transectLookups',
    function(
      BENTHIC_PQT_TYPE,
      $controller,
      $scope,
      ProjectService,
      BenthicPQTWizardConfig,
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
        data: {
          quadrat_transect: {
            quadrat_number_start: 1,
            quadrat_size: 1,
            number: 1
          },
          sample_event: {}
        }
      };
      //**************************************

      $controller('CollectBaseProtocol', {
        $scope: $scope,
        $ctrl: $ctrl
      });

      $ctrl.state = 'app.project.records.collectbenthicpqt';
      $ctrl.protocol = BENTHIC_PQT_TYPE;
      $scope.wizardConfig = BenthicPQTWizardConfig;

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

      $ctrl.init();
    }
  ]);
