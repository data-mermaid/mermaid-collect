angular.module('app.reference').controller('FishSpeciesCtrl', [
  '$scope',
  'choicesTable',
  'fishFamilies',
  'fishSpeciesRecord',
  'fishGenusRecord',
  function(
    $scope,
    choicesTable,
    fishFamilies,
    fishSpeciesRecord,
    fishGenusRecord
  ) {
    'use strict';

    $scope.choices = choicesTable;
    $scope.fishFamilies = fishFamilies;
    $scope.record = fishSpeciesRecord;
    $scope.genusRecord = fishGenusRecord;
  }
]);
