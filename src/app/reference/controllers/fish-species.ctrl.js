angular.module('app.reference').controller('FishSpeciesCtrl', [
  '$scope',
  '$stateParams',
  'ProjectService',
  'FishAttributeService',
  'fishGenera',
  'fishFamilies',
  function(
    $scope,
    $stateParams,
    ProjectService,
    FishAttributeService,
    fishGenera,
    fishFamilies
  ) {
    'use strict';

    var fishSpeciesId = $stateParams.id;
    $scope.record = {};
    $scope.genusRecord = {};
    $scope.fishGenera = [];
    $scope.isDisabled = true;
    $scope.fishGenera = fishGenera;
    $scope.fishFamilies = fishFamilies;

    ProjectService.fetchChoices().then(function(choices) {
      $scope.choices = choices;
    });

    FishAttributeService.getFishSpecies(fishSpeciesId, true).then(function(
      record
    ) {
      $scope.record = record;
      FishAttributeService.getFishGenus($scope.record.genus, true).then(
        function(record) {
          $scope.genusRecord = record;
        }
      );
    });
  }
]);
