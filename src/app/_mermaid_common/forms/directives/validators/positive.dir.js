angular.module('mermaid.forms').directive('positive', function() {
  'use strict';
  return {
    require: 'ngModel',
    link: function(scope, elem, attr, ngModel) {
      ngModel.validator_messages = ngModel.validator_messages || {};
      ngModel.validator_messages[
        window.appConfig.validatorPrefix + 'positive'
      ] = 'Value must be positive. ';

      function validate() {
        var is_valid = true;
        var val = ngModel.$modelValue;
        if (!isNaN(val) && val !== null) {
          is_valid = val >= 0;
        }
        ngModel.$setValidity(
          window.appConfig.validatorPrefix + 'positive',
          is_valid
        );
      }
      scope.$watch(function() {
        return ngModel.$modelValue;
      }, validate);
    }
  };
});
