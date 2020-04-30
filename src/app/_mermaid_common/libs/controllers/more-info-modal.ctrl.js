angular.module('mermaid.libs').controller('MoreInfoModalCtrl', [
  '$scope',
  '$ctrl',
  'Button',
  function($scope, $ctrl, Button) {
    'use strict';

    let isDisabled = false;
    let $uibModalInstance = $ctrl.$uibModalInstance;
    $ctrl.cancelBtn = new Button();

    $ctrl.cancelBtn.name = 'Cancel';
    $ctrl.cancelBtn.classes = 'btn-default';
    $ctrl.cancelBtn.enabled = !isDisabled;
    $ctrl.cancelBtn.click = function() {
      $uibModalInstance.dismiss();
    };

    $scope.modalTitle = $ctrl.modalTitle;
    $scope.$modalButtons = [$ctrl.cancelBtn];
  }
]);
