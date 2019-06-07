angular.module('app.reference').controller('FishGenusCtrl', [
  '$scope',
  '$stateParams',
  'FishAttributeService',
  'fishFamilies',
  function($scope, $stateParams, FishAttributeService, fishFamilies) {
    'use strict';

    var fishGenusId = $stateParams.id;
    $scope.record = {};
    $scope.fishFamilies = [];
    $scope.isDisabled = true;
    $scope.fishFamilies = fishFamilies;

    FishAttributeService.getFishGenus(fishGenusId, true).then(function(record) {
      $scope.record = record || {
        status: FishAttributeService.PROPOSED_RECORD
      };
    });
  }
]);
