angular.module('app.reference').controller('GroupingCtrl', [
  '$scope',
  '$stateParams',
  'ProjectService',
  'FishAttributeService',
  'fishFamilies',
  function(
    $scope,
    $stateParams,
    ProjectService,
    FishAttributeService,
    fishFamilies
  ) {
    'use strict';

    const groupingId = $stateParams.id;
    $scope.record = {};
    $scope.fishFamilies = fishFamilies;
    ProjectService.fetchChoices().then(function(choices) {
      $scope.choices = choices;
    });

    FishAttributeService.getFishGrouping(groupingId, true).then(function(
      record
    ) {
      $scope.record = record;
    });
  }
]);
