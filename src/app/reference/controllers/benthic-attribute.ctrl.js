angular.module('app.reference').controller('BenthicAttributeCtrl', [
  '$scope',
  '$stateParams',
  'ProjectService',
  'BenthicAttributeService',
  'parents',
  function(
    $scope,
    $stateParams,
    ProjectService,
    BenthicAttributeService,
    parents
  ) {
    'use strict';

    var benthicattributeId = $stateParams.id;
    $scope.record = {};
    $scope.isDisabled = true;
    $scope.parents = parents;

    BenthicAttributeService.getBenthicAttribute(benthicattributeId).then(
      function(record) {
        $scope.record = record;
      }
    );

    ProjectService.fetchChoices().then(function(choices) {
      $scope.choices = choices;
    });
  }
]);
