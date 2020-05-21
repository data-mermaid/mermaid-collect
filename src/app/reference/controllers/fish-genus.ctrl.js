angular.module('app.reference').controller('FishGenusCtrl', [
  '$scope',
  '$stateParams',
  'ProjectService',
  'FishAttributeService',
  'fishFamilies',
  function(
    $scope,
    $stateParams,
    ProjectService,
    FishAttributeService,
    fishFamilies
  ) {
    'use strict';

    var fishGenusId = $stateParams.id;
    $scope.record = {};
    $scope.fishFamilies = [];
    $scope.isDisabled = true;
    $scope.fishFamilies = fishFamilies;

    ProjectService.fetchChoices().then(function(choices) {
      $scope.choices = choices;
    });

    FishAttributeService.getFishGenus(fishGenusId, true).then(function(record) {
      $scope.record = record || {
        status: FishAttributeService.PROPOSED_RECORD
      };
    });
  }
]);
