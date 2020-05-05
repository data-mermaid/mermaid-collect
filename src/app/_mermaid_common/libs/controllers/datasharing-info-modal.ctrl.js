angular.module('mermaid.libs').controller('DatasharingInfoModalCtrl', [
  '$controller',
  '$scope',
  '$uibModalInstance',
  function($controller, $scope, $uibModalInstance) {
    'use strict';

    let $ctrl = this;
    $ctrl.modalTitle = 'Data Sharing';
    $ctrl.$uibModalInstance = $uibModalInstance;

    $controller('MoreInfoModalCtrl', { $scope: $scope, $ctrl: $ctrl });
  }
]);
