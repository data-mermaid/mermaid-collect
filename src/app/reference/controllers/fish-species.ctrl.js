angular.module('app.reference').controller('FishSpeciesCtrl', [
  '$scope',
  'fishGenera',
  'fishSpecies',
  'choices',
  function($scope, fishGenera, fishSpecies, choices) {
    'use strict';

    $scope.record = fishSpecies;
    $scope.fishGenera = [];
    $scope.isDisabled = true;
    $scope.fishGenera = fishGenera;
    $scope.choices = choices;
  }
]);
