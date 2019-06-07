angular.module('app.project').directive('validationDuplicateManagementsWarning', [
  '$stateParams',
  'ValidateDuplicationService',
  function($stateParams, ValidateDuplicationService) {
    'use strict';
    return {
      restrict: 'E',
      transclude: true,
      templateUrl:
        'app/project/directives/validation-duplicate-managements-warning.tpl.html',
      link: function(scope) {
        scope.managementsDuplicate = false;
        scope.managementsWarningMessage = '';
        scope.resolveDupCtrl = 'ResolveDuplicateMRsCtrl';

        scope.$on(ValidateDuplicationService.MR_PAGE, function(event, res) {
          scope.managementsDuplicate = res.duplicate;
          scope.managementsWarningMessage =
            'This project appears to have duplicate management regimes.';
        });
        ValidateDuplicationService.checkInvalidMRs($stateParams.project_id);
      }
    };
  }
]);
