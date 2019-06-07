angular.module('app.project').directive('validationDuplicateSitesAlert', [
  '$stateParams',
  'ValidateDuplicationService',
  function($stateParams, ValidateDuplicationService) {
    'use strict';
    return {
      restrict: 'E',
      templateUrl:
        'app/project/directives/validation-duplicate-sites-alert.tpl.html',
      link: function(scope) {
        scope.sitesDuplicate = false;
        scope.sitesWarningAlert = '';

        scope.$on(ValidateDuplicationService.SITE_PAGE, function(event, res) {
          scope.sitesDuplicate = res.duplicate;
          scope.sitesWarningAlert = 'Duplicate sites';
        });
        ValidateDuplicationService.checkInvalidSites($stateParams.project_id);
      }
    };
  }
]);
