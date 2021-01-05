angular.module('app.project').controller('CollectBeltFishTransectMethodCtrl', [
  'FISH_BELT_TRANSECT_TYPE',
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
    FISH_BELT_TRANSECT_TYPE,
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
    $ctrl.protocol = FISH_BELT_TRANSECT_TYPE;
    $scope.wizardConfig = FishBeltWizardConfig;
    Object.defineProperty(fishAttributes, 'filtered', {
      get() {
        const site = _.get($scope.record, 'data.sample_event.site');
        return ProjectService.filterAttributesBySite(
          fishAttributes,
          site,
          $scope.choices
        );
      }
    });
    $scope.fishAttributes = fishAttributes;
    $scope.protocolSampleUnitDetailsForm =
      'app/project/partials/forms/fishbeltprotocol.transect.form.tpl.html';
    $scope.protocolObservationsForm =
      'app/project/partials/forms/fishbeltprotocol.observations.form.tpl.html';

    $ctrl.init();
  }
]);
