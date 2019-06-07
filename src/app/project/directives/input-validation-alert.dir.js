angular.module('app.project').directive('inputValidationAlert', [
  'ValidateSubmitService',
  function(ValidateSubmitService) {
    'use strict';
    return {
      restrict: 'E',
      scope: {
        identifierValidations: '=',
        identifier: '@'
      },
      templateUrl: 'app/project/directives/input-validation-alert.tpl.html',
      link: function(scope) {
        scope.validations = {};
        var sortValidations = function(validations) {
          if (validations == null) {
            return null;
          }
          var warnings = [];
          var errors = [];
          _.each(validations, function(val) {
            if (val.status === ValidateSubmitService.WARN_VALIDATION_STATUS) {
              warnings.push(val.message);
            } else if (
              val.status === ValidateSubmitService.ERROR_VALIDATION_STATUS
            ) {
              errors.push(val.message);
            }
          });
          scope.validations.errors = errors.sort();
          scope.validations.warnings = warnings.sort();
        };

        scope.$watch(
          'identifierValidations',
          function(newVal) {
            if (newVal == null) {
              scope.validations = {};
              return;
            }
            sortValidations(newVal);
          },
          true
        );
      }
    };
  }
]);
