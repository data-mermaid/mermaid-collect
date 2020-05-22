angular.module('app.reference').controller('GroupingCtrl', [
  '$scope',
  '$stateParams',
  'FishAttributeService',
  function($scope, $stateParams, FishAttributeService) {
    'use strict';

    const groupingId = $stateParams.id;
    $scope.record = {};

    FishAttributeService.getFishGrouping(groupingId, true).then(function(
      record
    ) {
      console.log(record);
      $scope.record = record;
    });
  }
]);
