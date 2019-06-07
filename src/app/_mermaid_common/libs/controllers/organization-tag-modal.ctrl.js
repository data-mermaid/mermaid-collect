angular.module('mermaid.libs').controller('OrganizationTagModalCtrl', [
  '$scope',
  'Button',
  '$uibModalInstance',
  function($scope, Button, $uibModalInstance) {
    'use strict';

    let isDisabled = false;

    let sendBtn = new Button();
    let cancelBtn = new Button();

    sendBtn.name = 'Send to MERMAID for review';
    sendBtn.icon = 'fa fa-send';
    sendBtn.classes = 'btn-success';
    sendBtn.enabled = !isDisabled;
    sendBtn.click = function() {
      $uibModalInstance.close($scope.record.tag);
    };

    cancelBtn.name = 'Cancel';
    cancelBtn.classes = 'btn-default';
    cancelBtn.enabled = !isDisabled;
    cancelBtn.click = function() {
      $uibModalInstance.dismiss();
    };

    $scope.record = {};
    $scope.modalTitle = 'Suggest a new organization';
    $scope.$modalButtons = [sendBtn, cancelBtn];

    $scope.$watch(
      function() {
        return $scope.record.tag;
      },
      function(v) {
        sendBtn.enabled = v;
      }
    );
  }
]);
