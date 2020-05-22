angular.module('app.reference').controller('FishGenusCtrl', [
  '$scope',
  '$stateParams',
  'choicesTable',
  'FishAttributeService',
  'fishFamilies',
  function(
    $scope,
    $stateParams,
    choicesTable,
    FishAttributeService,
    fishFamilies
  ) {
    'use strict';

    const fishGenusId = $stateParams.id;
    $scope.record = {};
    $scope.choices = choicesTable;
    $scope.fishFamilies = fishFamilies;

    FishAttributeService.getFishGenus(fishGenusId, true).then(function(record) {
      $scope.record = record || {
        status: FishAttributeService.PROPOSED_RECORD
      };
    });
  }
]);
