angular
  .module('mermaid.forms')
  .directive('requiresval', function(ValidatorService) {
    'use strict';
    return {
      require: 'ngModel',
      link: function(scope, elem, attr, ngModel) {
        ngModel.validator_messages = ngModel.validator_messages || {};
        ngModel.validator_messages[
          window.appConfig.validatorPrefix + 'requiresval'
        ] = 'Required.';

        function validate() {
          var is_valid = ValidatorService.requiresvalue(ngModel.$modelValue);
          ngModel.$setValidity(
            window.appConfig.validatorPrefix + 'requiresval',
            is_valid
          );
        }
        scope.$watch(function() {
          return ngModel.$modelValue;
        }, validate);
      }
    };
  });
