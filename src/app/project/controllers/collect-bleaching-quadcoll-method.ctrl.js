angular.module('app.project').controller('CollectBleachingQuadCollMethodCtrl', [
  '$controller',
  '$scope',
  'ProjectService',
  'TransectService',
  'BleachingWizardConfig',
  'collectRecord',
  'currentUser',
  'projectProfile',
  'transectLookups',
  'benthicAttributes',
  function(
    $controller,
    $scope,
    ProjectService,
    TransectService,
    BleachingWizardConfig,
    collectRecord,
    currentUser,
    projectProfile,
    transectLookups,
    benthicAttributes
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
        quadrat_collection: {},
        sample_event: {}
      }
    };
    //**************************************

    $controller('CollectBaseProtocol', { $scope: $scope, $ctrl: $ctrl });
    const baseSave = $ctrl.save;

    $ctrl.state = 'app.project.records.collectbleaching';
    $ctrl.protocol = ProjectService.BLEACHING_QC_QUADRAT_TYPE;

    $ctrl.save = function() {
      TransectService.setObservationIntervals(
        $scope.record.data.obs_quadrat_benthic_percent || [],
        1,
        'quadrat_number'
      );
      return baseSave();
    };

    $scope.wizardConfig = BleachingWizardConfig;
    $scope.benthicAttributes = function() {
      const site = _.get($scope.record, 'data.sample_event.site');
      return ProjectService.filterAttributesBySite(
        benthicAttributes,
        site,
        $scope.choices
      );
    };
    $scope.protocolSampleUnitDetailsForm =
      'app/project/partials/forms/bleachingprotocol.quadcoll.form.tpl.html';
    $scope.protocolObservationsForm =
      'app/project/partials/forms/bleachingprotocol.observations.form.tpl.html';
  }
]);
