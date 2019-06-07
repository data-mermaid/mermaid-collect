angular
  .module('mermaid.forms')
  .directive('minvalue', function(utils, ValidatorService) {
    'use strict';
    return {
      require: 'ngModel',
      link: function(scope, elem, attr, ngModel) {
        var attr_minval = attr.minvalue;
        if (attr_minval.endsWith("'")) {
          attr_minval = attr_minval.substr(0, attr_minval.length - 1);
        }

        if (attr_minval.startsWith("'")) {
          attr_minval = attr_minval.substr(1);
        }

        var args = attr_minval.split(':');
        var minvalue = Number(args[0]);
        var inclusive = utils.truthy(args[1]);
        var validation_msg;
        if (inclusive) {
          validation_msg = 'Value must be greater than or equal to ';
        } else {
          validation_msg = 'Value must be greater than ';
        }
        ngModel.validator_messages = ngModel.validator_messages || {};
        ngModel.validator_messages[
          window.appConfig.validatorPrefix + 'minvalue'
        ] = validation_msg + minvalue;

        function validate() {
          var val = ngModel.$modelValue;
          var is_valid = ValidatorService.minvalue(val, minvalue, inclusive);
          ngModel.$setValidity(
            window.appConfig.validatorPrefix + 'minvalue',
            is_valid
          );
        }

        scope.$watch(function() {
          return ngModel.$modelValue;
        }, validate);
      }
    };
  });
