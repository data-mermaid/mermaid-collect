angular.module('app.reference').controller('FishFamilyCtrl', [
  '$scope',
  '$stateParams',
  'choicesTable',
  'FishAttributeService',
  function($scope, $stateParams, choicesTable, FishAttributeService) {
    'use strict';

    const fishFamilyId = $stateParams.id;
    $scope.record = {};
    $scope.choices = choicesTable;

    FishAttributeService.getFishFamily(fishFamilyId, true).then(function(
      record
    ) {
      $scope.record = record;
    });
  }
]);
