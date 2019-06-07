angular.module('app.project').directive('validationAlert', [
  '$document',
  'ValidateSubmitService',
  function($document, ValidateSubmitService) {
    'use strict';
    return {
      restrict: 'E',
      transclude: {
        validationwizard: '?validationwizard'
      },
      scope: {
        identifier: '=',
        status: '=',
        messages: '=',
        record: '='
      },
      templateUrl: 'app/project/directives/validation-alert.tpl.html',
      link: function(scope) {
        var warningIcon = 'fa-warning';
        var errorIcon = 'fa-times-circle-o';
        var warningTooltip = 'Warning: resolve or ignore';
        var errorTooltip = 'Error: must be resolved in order to submit';

        if (scope.status === ValidateSubmitService.ERROR_VALIDATION_STATUS) {
          scope.icon = errorIcon;
          scope.alertClass = 'danger';
          scope.tooltip = errorTooltip;
        } else {
          scope.icon = warningIcon;
          scope.alertClass = 'warning';
          scope.tooltip = warningTooltip;
        }

        var getElement = function(identifier) {
          var hash = 'validation-identifier-' + identifier;
          return angular.element(document.getElementById(hash));
        };

        scope.hasElement = function(identifier) {
          var elem = getElement(identifier);
          return elem.length > 0;
        };

        scope.scrollTo = function(identifier) {
          var elem = getElement(identifier);
          if (elem.length === 0) {
            return;
          }
          $document.scrollToElementAnimated(elem, 225);
        };
      }
    };
  }
]);
