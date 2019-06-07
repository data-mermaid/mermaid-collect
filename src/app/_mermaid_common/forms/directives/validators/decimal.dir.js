// Used in Number Inputs

angular.module('mermaid.forms').directive('decimal', function(utils) {
  'use strict';
  return {
    require: 'ngModel',
    link: function(scope, elem, attr, ngModel) {
      var args = attr.decimal.substr(1, attr.decimal.length - 2).split(':');
      var decimalMaxDigits = parseInt(args[0], 10);
      var decimalDecimalPlaces = parseInt(args[1], 10);

      var validation_msg = 'Value must have a maximum of ' + decimalMaxDigits;
      validation_msg += utils.pluralize(decimalMaxDigits, ' digit', ' digits');
      validation_msg += ' and a maximum of ' + decimalDecimalPlaces;
      validation_msg += utils.pluralize(
        decimalDecimalPlaces,
        ' decimal',
        ' decimals'
      );
      validation_msg += '.';

      ngModel.validator_messages = ngModel.validator_messages || {};
      ngModel.validator_messages[
        window.appConfig.validatorPrefix + 'decimal'
      ] = validation_msg;

      function validate() {
        var max_digit_count_check;
        var decimals_check;
        var is_valid = true;
        var num_digits;
        var str_number;
        var number_parts;
        var positive_num;
        var decimals;
        var val = ngModel.$modelValue;

        if (val != null) {
          str_number = val.toString();
          number_parts = str_number.split('.');
          positive_num = number_parts[0];
          decimals = number_parts.length > 1 ? number_parts[1] : '';

          num_digits = positive_num.length + decimals.length;

          max_digit_count_check = num_digits <= decimalMaxDigits;
          decimals_check = decimals.length <= decimalDecimalPlaces;
          is_valid = max_digit_count_check && decimals_check;
        }

        ngModel.$setValidity(
          window.appConfig.validatorPrefix + 'decimal',
          is_valid
        );
      }
      scope.$watch(function() {
        return ngModel.$modelValue;
      }, validate);
    }
  };
});
