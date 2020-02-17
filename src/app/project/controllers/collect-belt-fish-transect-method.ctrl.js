angular.module('app.project').controller('CollectBeltFishTransectMethodCtrl', [
  '$controller',
  '$scope',
  'ProjectService',
  'FishBeltWizardConfig',
  'fishAttributes',
  'collectRecord',
  'currentUser',
  'projectProfile',
  'transectLookups',
  function(
    $controller,
    $scope,
    ProjectService,
    FishBeltWizardConfig,
    fishAttributes,
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
      data: { sample_event: {}, fishbelt_transect: {} }
    };
    //**************************************

    $controller('CollectBaseProtocol', { $scope: $scope, $ctrl: $ctrl });

    $ctrl.state = 'app.project.records.collectfishbelt';
    $ctrl.protocol = ProjectService.FISH_BELT_TRANSECT_TYPE;
    $scope.wizardConfig = FishBeltWizardConfig;
    $scope.fishAttributes = function() {
      const site = _.get($scope.record, 'data.sample_event.site');
      return ProjectService.filterAttributesBySite(
        fishAttributes,
        site,
        $scope.choices
      );
    };
    $scope.protocolSampleUnitDetailsForm =
      'app/project/partials/forms/fishbeltprotocol.transect.form.tpl.html';
    $scope.protocolObservationsForm =
      'app/project/partials/forms/fishbeltprotocol.observations.form.tpl.html';

    $ctrl.init();
  }
]);
