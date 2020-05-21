angular.module('app.reference').controller('FishFamilyCtrl', [
  '$scope',
  '$stateParams',
  'ProjectService',
  'FishAttributeService',
  function($scope, $stateParams, ProjectService, FishAttributeService) {
    'use strict';

    var fishFamilyId = $stateParams.id;
    $scope.record = {};
    $scope.isDisabled = true;

    ProjectService.fetchChoices().then(function(choices) {
      $scope.choices = choices;
    });

    FishAttributeService.getFishFamily(fishFamilyId, true).then(function(
      record
    ) {
      $scope.record = record;
    });
  }
]);
