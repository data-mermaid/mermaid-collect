angular
  .module('mermaid.forms')
  .directive('integer', function(ValidatorService) {
    'use strict';
    return {
      require: 'ngModel',
      link: function(scope, elem, attr, ngModel) {
        ngModel.validator_messages = ngModel.validator_messages || {};
        ngModel.validator_messages[
          window.appConfig.validatorPrefix + 'integer'
        ] = 'Value must be a whole number.';

        function validate() {
          var val = ngModel.$modelValue;
          var is_valid = ValidatorService.integervalue(val);
          ngModel.$setValidity(
            window.appConfig.validatorPrefix + 'integer',
            is_valid
          );
        }
        scope.$watch(function() {
          return ngModel.$modelValue;
        }, validate);
      }
    };
  });
