angular.module('app.home').controller('ErrorCtrl', [
  '$scope',
  '$stateParams',
  function($scope, $stateParams) {
    'use strict';
    $scope.rejection = $stateParams.rejection || null;
    $scope.apperror = $stateParams.apperror || null;
  }
]);
