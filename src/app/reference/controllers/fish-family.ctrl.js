angular.module('app.reference').controller('FishFamilyCtrl', [
  '$scope',
  '$stateParams',
  'FishAttributeService',
  function($scope, $stateParams, FishAttributeService) {
    'use strict';

    var fishFamilyId = $stateParams.id;
    $scope.record = {};
    $scope.isDisabled = true;

    FishAttributeService.getFishFamily(fishFamilyId, true).then(function(
      record
    ) {
      $scope.record = record;
    });
  }
]);
