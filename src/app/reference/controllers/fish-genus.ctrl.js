angular.module('app.reference').controller('FishGenusCtrl', [
  '$scope',
  'fishFamilies',
  'fishGenus',
  function($scope, fishFamilies, fishGenus) {
    'use strict';

    $scope.record = fishGenus;
    $scope.fishFamilies = [];
    $scope.isDisabled = true;
    $scope.fishFamilies = fishFamilies;
  }
]);
