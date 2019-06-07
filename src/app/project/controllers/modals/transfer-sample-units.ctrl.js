angular.module('app.project').controller('TransferSampleUnitsCtrl', [
  '$uibModalInstance',
  '$scope',
  'Button',
  'fromOwner',
  'ownerChoices',
  'currentProfile',
  function(
    $uibModalInstance,
    $scope,
    Button,
    fromOwner,
    ownerChoices,
    currentProfile
  ) {
    'use strict';

    const projectProfile =
      _.find(ownerChoices, {
        profile: currentProfile.id
      }) || {};
    $scope.fromOwner = fromOwner;
    $scope.data = { toOwner: projectProfile.id };
    $scope.ownerChoices = ownerChoices;

    const cancelButton = new Button();
    cancelButton.enabled = true;
    cancelButton.name = 'Cancel';
    cancelButton.classes = 'btn-default';
    cancelButton.click = function() {
      $uibModalInstance.dismiss('cancel');
    };

    const transferButton = new Button();
    transferButton.enabled = false;
    transferButton.name = 'Transfer Records';
    transferButton.classes = 'btn-success';
    transferButton.click = function() {
      const selectedProfile = _.find(ownerChoices, {
        id: $scope.data.toOwner
      });
      $uibModalInstance.close(selectedProfile.profile);
    };

    $scope.$watch('data.toOwner', function(toOwner) {
      transferButton.enabled = toOwner != null;
    });

    $scope.$modalButtons = [transferButton, cancelButton];
  }
]);
