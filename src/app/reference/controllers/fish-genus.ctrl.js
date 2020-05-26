angular.module('app.reference').controller('FishGenusCtrl', [
  '$scope',
  'choicesTable',
  'fishFamilies',
  'fishGenusRecord',
  function($scope, choicesTable, fishFamilies, fishGenusRecord) {
    'use strict';

    $scope.choices = choicesTable;
    $scope.fishFamilies = fishFamilies;
    $scope.record = fishGenusRecord;
  }
]);
