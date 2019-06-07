angular.module('mermaid.libs').controller('BaseAttributeModalCtrl', [
  '$scope',
  'Button',
  '$ctrl',
  'authService',
  function($scope, Button, $ctrl, authService) {
    'use strict';

    let isDisabled = false;
    let $uibModalInstance = $ctrl.$uibModalInstance;

    $ctrl.proposeNewAttributeBtn = new Button();
    $ctrl.sendBtn = new Button();
    $ctrl.backBtn = new Button();
    $ctrl.cancelBtn = new Button();
    $ctrl.closeBtn = new Button();

    authService.getCurrentUser().then(function(user) {
      $scope.full_name = user.full_name;
    });

    let navPage = function(page) {
      $scope.modalSection = page;
      if (page === 1) {
        $scope.$modalButtons = [$ctrl.proposeNewAttributeBtn, $ctrl.cancelBtn];
      } else if (page === 2) {
        $scope.$modalButtons = [$ctrl.backBtn, $ctrl.sendBtn, $ctrl.cancelBtn];
      } else if (page === 3) {
        $scope.$modalButtons = [$ctrl.closeBtn];
      }
    };

    // Page 1 buttons
    $ctrl.proposeNewAttributeBtn.name = $ctrl.proposeBtnLabel;
    $ctrl.proposeNewAttributeBtn.classes = 'btn-success';
    $ctrl.proposeNewAttributeBtn.enabled = !isDisabled;
    $ctrl.proposeNewAttributeBtn.onlineOnly = false;
    $ctrl.proposeNewAttributeBtn.click = function() {
      navPage(2);
    };

    $ctrl.cancelBtn.name = 'Cancel';
    $ctrl.cancelBtn.classes = 'btn-default';
    $ctrl.cancelBtn.enabled = !isDisabled;
    $ctrl.cancelBtn.onlineOnly = false;
    $ctrl.cancelBtn.click = function() {
      $uibModalInstance.dismiss();
    };

    // Page 2 buttons
    $ctrl.sendBtn.name = 'Send to MERMAID for review';
    $ctrl.sendBtn.icon = 'fa fa-send';
    $ctrl.sendBtn.classes = 'btn-success';
    $ctrl.sendBtn.enabled = !isDisabled;
    $ctrl.sendBtn.onlineOnly = false;
    $ctrl.sendBtn.click = function() {
      isDisabled = true;
      $ctrl
        .save($scope.record)
        .then(function(record) {
          $scope.record = record;
          $uibModalInstance.close($scope.record);
        })
        .finally(function() {
          isDisabled = false;
        });
    };

    $ctrl.backBtn.name = 'Back';
    $ctrl.backBtn.classes = 'btn-default pull-left';
    $ctrl.backBtn.icon = 'fa fa-long-arrow-left';
    $ctrl.backBtn.enabled = !isDisabled;
    $ctrl.backBtn.onlineOnly = false;
    $ctrl.backBtn.click = function() {
      navPage(1);
    };

    $scope.record = {};
    $scope.modalSection = 1;
    $scope.modalTitle = $ctrl.modalTitle;

    $scope.$modalButtons = [$ctrl.proposeNewAttributeBtn, $ctrl.cancelBtn];
  }
]);
