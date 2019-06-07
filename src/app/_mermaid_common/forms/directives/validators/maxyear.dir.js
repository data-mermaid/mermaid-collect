angular.module('mermaid.forms').directive('maxyear', function() {
  'use strict';
  return {
    require: 'ngModel',
    link: function(scope, elem, attr, ngModel) {
      ngModel.validator_messages = ngModel.validator_messages || {};
      ngModel.validator_messages[window.appConfig.validatorPrefix + 'maxyear'] =
        'Year must be current year or earlier.';

      function validate() {
        var is_valid = true;
        var val = ngModel.$modelValue;
        if (!isNaN(val) && val !== null) {
          is_valid = val <= new Date().getFullYear();
        }
        ngModel.$setValidity(
          window.appConfig.validatorPrefix + 'maxyear',
          is_valid
        );
      }
      scope.$watch(function() {
        return ngModel.$modelValue;
      }, validate);
    }
  };
});
