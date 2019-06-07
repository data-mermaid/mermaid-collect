angular.module('app.project').directive('validationDuplicateSitesWarning', [
  '$stateParams',
  'ValidateDuplicationService',
  function($stateParams, ValidateDuplicationService) {
    'use strict';
    return {
      restrict: 'E',
      transclude: true,
      templateUrl:
        'app/project/directives/validation-duplicate-sites-warning.tpl.html',
      link: function(scope) {
        scope.sitesDuplicate = false;
        scope.siteWarningMessage = '';
        scope.resolveDupCtrl = 'ResolveDuplicateSitesCtrl';

        scope.$on(ValidateDuplicationService.SITE_PAGE, function(event, res) {
          scope.sitesDuplicate = res.duplicate;
          scope.sitesWarningMessage =
            'This project appears to have duplicate sites.';
        });
        ValidateDuplicationService.checkInvalidSites($stateParams.project_id);
      }
    };
  }
]);
