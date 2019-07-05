angular.module('app.reference').controller('FishFamilyCtrl', [
  '$scope',
  'fishFamily',
  function($scope, fishFamily) {
    'use strict';

    $scope.isDisabled = true;
    $scope.record = fishFamily;
  }
]);
