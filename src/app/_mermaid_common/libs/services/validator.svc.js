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

    return {
      integervalue: integervalue,
      maxvalue: maxvalue,
      minvalue: minvalue,
      requiresvalue: requiresvalue
    };
  }
]);
