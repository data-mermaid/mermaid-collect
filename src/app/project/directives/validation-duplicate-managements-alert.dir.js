angular.module('app.project').directive('validationDuplicateManagementsAlert', [
  '$stateParams',
  'ValidateDuplicationService',
  function($stateParams, ValidateDuplicationService) {
    'use strict';
    return {
      restrict: 'E',
      templateUrl:
        'app/project/directives/validation-duplicate-managements-alert.tpl.html',
      link: function(scope) {
        scope.managementDuplicate = false;
        scope.managementWarningAlert = '';

        scope.$on(ValidateDuplicationService.MR_PAGE, function(event, res) {
          scope.managementDuplicate = res.duplicate;
          scope.managementWarningAlert = 'Duplicate management regimes';
        });
        ValidateDuplicationService.checkInvalidMRs($stateParams.project_id);
      }
    };
  }
]);
