angular.module('mermaid.libs').controller('BenthicAttributeModalCtrl', [
  '$controller',
  '$scope',
  '$uibModalInstance',
  'BenthicAttributeService',
  function($controller, $scope, $uibModalInstance, BenthicAttributeService) {
    'use strict';

    let $ctrl = this;
    $ctrl.modalTitle = 'Add New Benthic Attribute';
    $ctrl.proposeBtnLabel = 'Propose new attribute';
    $ctrl.save = BenthicAttributeService.save;
    $ctrl.$uibModalInstance = $uibModalInstance;

    $controller('BaseAttributeModalCtrl', { $scope: $scope, $ctrl: $ctrl });

    $scope.parents = [];

    BenthicAttributeService.fetchBenthicAttributes().then(function(records) {
      $scope.parents = records;
    });
  }
]);
