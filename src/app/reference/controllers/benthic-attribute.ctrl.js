angular.module('app.reference').controller('BenthicAttributeCtrl', [
  '$scope',
  'choices',
  'parents',
  'benthicAttribute',
  function($scope, choices, parents, benthicAttribute) {
    'use strict';

    $scope.isDisabled = true;
    $scope.parents = parents;
    $scope.record = benthicAttribute;
    $scope.choices = choices;
  }
]);
