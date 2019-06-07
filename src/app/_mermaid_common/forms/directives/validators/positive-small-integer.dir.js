angular.module('mermaid.forms').directive('positiveSmallInteger', function() {
  'use strict';
  return {
    require: 'ngModel',
    link: function(scope, elem, attr, ngModel) {
      ngModel.validator_messages = ngModel.validator_messages || {};
      ngModel.validator_messages[
        window.appConfig.validatorPrefix + 'small_positive_integer'
      ] = 'Value must be an integer between 0 and 32767.';

      function validate() {
        var is_valid = true;
        var val = ngModel.$modelValue;
        var is_number_check = false;
        var whole_number_check = false;
        var small_positive_integer_check = false;

        is_number_check = Number.isFinite(val);
        if (is_number_check === true) {
          whole_number_check = val % 1 === 0;
          small_positive_integer_check = val >= 0 && val <= 32767;
          is_valid =
            is_number_check &&
            whole_number_check &&
            small_positive_integer_check;
        }

        ngModel.$setValidity(
          window.appConfig.validatorPrefix + 'small_positive_integer',
          is_valid
        );
      }
      scope.$watch(function() {
        return ngModel.$modelValue;
      }, validate);
    }
  };
});
