angular.module('app.reference').controller('FishSpeciesCtrl', [
  '$scope',
  '$stateParams',
  'ProjectService',
  'FishAttributeService',
  'fishGenera',
  function(
    $scope,
    $stateParams,
    ProjectService,
    FishAttributeService,
    fishGenera
  ) {
    'use strict';

    var fishSpeciesId = $stateParams.id;
    $scope.record = {};
    $scope.fishGenera = [];
    $scope.isDisabled = true;
    $scope.fishGenera = fishGenera;

    ProjectService.fetchChoices().then(function(choices) {
      $scope.choices = choices;
    });

    FishAttributeService.getFishSpecies(fishSpeciesId, true).then(function(
      record
    ) {
      $scope.record = record;
    });
  }
]);
