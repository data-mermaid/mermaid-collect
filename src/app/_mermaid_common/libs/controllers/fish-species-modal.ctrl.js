angular.module('mermaid.libs').controller('FishSpeciesModalCtrl', [
  '$controller',
  '$scope',
  '$uibModalInstance',
  'FishAttributeService',
  function($controller, $scope, $uibModalInstance, FishAttributeService) {
    'use strict';

    let $ctrl = this;
    $ctrl.modalTitle = 'Add New Fish Species';
    $ctrl.proposeBtnLabel = 'Propose new species';
    $ctrl.save = FishAttributeService.saveFishSpecies;
    $ctrl.$uibModalInstance = $uibModalInstance;

    $controller('BaseAttributeModalCtrl', { $scope: $scope, $ctrl: $ctrl });

    $scope.fishGenusChoices = [];

    FishAttributeService.fetchFishGenera().then(function(records) {
      $scope.fishGenusChoices = records;
    });

    $scope.fishGenusLookup = function(genusId) {
      const result = _.filter($scope.fishGenusChoices, { id: genusId });
      if (result.length > 0) {
        return result[0].name;
      }
      return '';
    };

    $scope.$watch(
      'record',
      function() {
        $ctrl.proposeNewAttributeBtn.enabled =
          $scope.record &&
          $scope.record.name != null &&
          $scope.record.genus != null;
      },
      true
    );
  }
]);
