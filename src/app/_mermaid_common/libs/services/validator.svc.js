angular.module('mermaid.libs').service('ValidatorService', [
  function() {
    'use strict';

    const minvalue = function(val, minValue, inclusive) {
      var isValid = true;

      if (!isNaN(val) && val !== null) {
        if (inclusive) {
          isValid = val >= minValue;
        } else {
          isValid = val > minValue;
        }
      }
      return isValid;
    };

    const maxvalue = function(val, maxValue, inclusive) {
      var isValid = true;

      if (!isNaN(val) && val !== null) {
        if (inclusive) {
          isValid = val <= maxValue;
        } else {
          isValid = val < maxValue;
        }
      }
      return isValid;
    };

    const requiresvalue = function(val) {
      return val != null;
    };

    const integervalue = function(val) {
      return Number.isFinite(val) && val % 1 === 0;
    };

    const decimalvalue = function(val, decimalMaxDigits, decimalDecimalPlaces) {
      if (val != null) {
        const str_number = val.toString();
        const number_parts = str_number.split('.');
        const positive_num = number_parts[0];
        const decimals = number_parts.length > 1 ? number_parts[1] : '';

        const num_digits = positive_num.length + decimals.length;

        const max_digit_count_check = num_digits <= decimalMaxDigits;
        const decimals_check = decimals.length <= decimalDecimalPlaces;
        return max_digit_count_check && decimals_check;
      }
      return true;
    };

    return {
      decimalvalue: decimalvalue,
      integervalue: integervalue,
      maxvalue: maxvalue,
      minvalue: minvalue,
      requiresvalue: requiresvalue
    };
  }
]);
