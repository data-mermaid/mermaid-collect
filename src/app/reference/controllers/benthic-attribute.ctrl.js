angular.module('app.reference').controller('BenthicAttributeCtrl', [
  '$scope',
  '$stateParams',
  'choicesTable',
  'BenthicAttributeService',
  'parents',
  function(
    $scope,
    $stateParams,
    choicesTable,
    BenthicAttributeService,
    parents
  ) {
    'use strict';

    const benthicattributeId = $stateParams.id;
    $scope.record = {};
    $scope.choices = choicesTable;
    $scope.parents = parents;

    BenthicAttributeService.getBenthicAttribute(benthicattributeId).then(
      function(record) {
        $scope.record = record;
      }
    );
  }
]);
