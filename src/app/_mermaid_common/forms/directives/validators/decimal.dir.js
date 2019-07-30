// Used in Number Inputs

angular
  .module('mermaid.forms')
  .directive('decimal', function(utils, ValidatorService) {
    'use strict';
    return {
      require: 'ngModel',
      link: function(scope, elem, attr, ngModel) {
        // var args = attr.decimal.substr(1, attr.decimal.length - 2).split(':');
        var attr_decimal = attr.decimal;
        if (attr_decimal.endsWith("'")) {
          attr_decimal = attr_decimal.substr(0, attr_decimal.length - 1);
        }

        if (attr_decimal.startsWith("'")) {
          attr_decimal = attr_decimal.substr(1);
        }

        var args = attr_decimal.split(':');
        var decimalMaxDigits = parseInt(args[0], 10);
        var decimalDecimalPlaces = parseInt(args[1], 10);

        var validation_msg = 'Value must have a maximum of ' + decimalMaxDigits;
        validation_msg += utils.pluralize(
          decimalMaxDigits,
          ' digit',
          ' digits'
        );
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
          const val = ngModel.$modelValue;
          const is_valid = ValidatorService.decimalvalue(
            val,
            decimalMaxDigits,
            decimalDecimalPlaces
          );

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
