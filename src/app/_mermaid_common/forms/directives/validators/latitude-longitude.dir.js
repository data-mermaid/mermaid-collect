angular.module('mermaid.forms').directive('latitude', function() {
  'use strict';
  return {
    require: 'ngModel',
    link: function(scope, elem, attr, ngModel) {
      ngModel.validator_messages = ngModel.validator_messages || {};
      ngModel.validator_messages[
        window.appConfig.validatorPrefix + 'latitude'
      ] = 'Latitude should be between -90&deg; and 90&deg;.';

      function validate() {
        var is_valid = true;
        var val = ngModel.$modelValue;
        if (!isNaN(val) && val !== null) {
          is_valid = val >= -90.0 && val <= 90.0;
        }
        ngModel.$setValidity(
          window.appConfig.validatorPrefix + 'latitude',
          is_valid
        );
      }
      scope.$watch(function() {
        return ngModel.$modelValue;
      }, validate);
    }
  };
});

angular.module('mermaid.forms').directive('longitude', function() {
  'use strict';
  return {
    require: 'ngModel',
    link: function(scope, elem, attr, ngModel) {
      ngModel.validator_messages = ngModel.validator_messages || {};
      ngModel.validator_messages[
        window.appConfig.validatorPrefix + 'longitude'
      ] = 'Longitude should be between -180&deg; and 180&deg;.';

      function validate() {
        var is_valid = true;
        var val = ngModel.$modelValue;
        if (!isNaN(val) && val !== null) {
          is_valid = val >= -180.0 && val <= 180.0;
        }
        ngModel.$setValidity(
          window.appConfig.validatorPrefix + 'longitude',
          is_valid
        );
      }
      scope.$watch(function() {
        return ngModel.$modelValue;
      }, validate);
    }
  };
});
