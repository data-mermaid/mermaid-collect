angular.module('app.reference').controller('BenthicAttributeCtrl', [
  '$scope',
  'choicesTable',
  'benthicAttributes',
  'benthicAttributeRecord',
  function($scope, choicesTable, benthicAttributes, benthicAttributeRecord) {
    'use strict';

    $scope.choices = choicesTable;
    $scope.parents = benthicAttributes;
    $scope.record = benthicAttributeRecord;
  }
]);
