angular.module('app.reference').controller('FishSpeciesCtrl', [
  '$scope',
  '$stateParams',
  'FishAttributeService',
  'choicesTable',
  'fishFamilies',
  function(
    $scope,
    $stateParams,
    FishAttributeService,
    choicesTable,
    fishFamilies
  ) {
    'use strict';

    const fishSpeciesId = $stateParams.id;
    $scope.record = {};
    $scope.genusRecord = {};
    $scope.choices = choicesTable;
    $scope.fishFamilies = fishFamilies;

    FishAttributeService.getFishSpecies(fishSpeciesId, true).then(function(
      record
    ) {
      $scope.record = record;
      FishAttributeService.getFishGenus(record.genus, true).then(function(
        genusRecord
      ) {
        $scope.genusRecord = genusRecord;
      });
    });
  }
]);
