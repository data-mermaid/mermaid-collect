angular
  .module('mermaid.forms')
  .directive('maxvalue', function(utils, ValidatorService) {
    'use strict';
    return {
      require: 'ngModel',
      link: function(scope, elem, attr, ngModel) {
        var attr_maxval = attr.maxvalue;
        if (attr_maxval.endsWith("'")) {
          attr_maxval = attr_maxval.substr(0, attr_maxval.length - 1);
        }

        if (attr_maxval.startsWith("'")) {
          attr_maxval = attr_maxval.substr(1);
        }

        var args = attr_maxval.split(':');
        var maxvalue = Number(args[0]);

        var inclusive = utils.truthy(args[1]);
        var validation_msg;
        if (inclusive) {
          validation_msg = 'Value must be less than or equal to ';
        } else {
          validation_msg = 'Value must be less than ';
        }
        ngModel.validator_messages = ngModel.validator_messages || {};
        ngModel.validator_messages[
          window.appConfig.validatorPrefix + 'maxvalue'
        ] = validation_msg + maxvalue;

        function validate() {
          var val = ngModel.$modelValue;
          var is_valid = ValidatorService.maxvalue(val, maxvalue, inclusive);
          ngModel.$setValidity(
            window.appConfig.validatorPrefix + 'maxvalue',
            is_valid
          );
        }

        scope.$watch(function() {
          return ngModel.$modelValue;
        }, validate);
      }
    };
  });
