angular.module('mermaid.libs').controller('MoreInfoModalCtrl', [
  '$scope',
  'Button',
  '$uibModalInstance',
  function($scope, Button, $uibModalInstance) {
    'use strict';

    let isDisabled = false;
    let cancelBtn = new Button();

    cancelBtn.name = 'Cancel';
    cancelBtn.classes = 'btn-default';
    cancelBtn.enabled = !isDisabled;
    cancelBtn.click = function() {
      $uibModalInstance.dismiss();
    };

    $scope.modalTitle = 'Data Sharing';
    $scope.$modalButtons = [cancelBtn];
  }
]);
