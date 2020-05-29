angular.module('app.reference').controller('GroupingCtrl', [
  '$scope',
  'choicesTable',
  'fishFamilies',
  'fishGroupingRecord',
  function($scope, choicesTable, fishFamilies, fishGroupingRecord) {
    'use strict';

    $scope.choices = choicesTable;
    $scope.fishFamilies = fishFamilies;
    $scope.record = fishGroupingRecord;
  }
]);
