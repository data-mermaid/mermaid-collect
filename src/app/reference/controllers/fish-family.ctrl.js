angular.module('app.reference').controller('FishFamilyCtrl', [
  '$scope',
  'choicesTable',
  'fishFamilyRecord',
  function($scope, choicesTable, fishFamilyRecord) {
    'use strict';

    $scope.choices = choicesTable;
    $scope.record = fishFamilyRecord;
  }
]);
