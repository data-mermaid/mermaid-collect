/*
  Number parameters

  REQUIRED:

  widget-form: Name of form widget is being used
  widget-name: <input> name
  ng-model: ng-model

  OPTIONAL:

  widget-label: label for input
  widget-help: Small help text added under <select>
  widget-if: ng-if
  widget-required: ng-required
  widget-disabled: ng-disabled
  widget-readonly: ng-readonly
  widget-allow-invalid
  widget-change: ng-change
  widget-blur: ng-blur
  widget-prepend: add text start of input (example: "$")
  widget-append: add text end of input (example: "/hr")
  widget-maxlength: ng-maxlength
  widget-minlength: ng-minlength
  widget-init-value: Set the initial value of the model
  widget-validators: Comma delimited list of validator directives

  widget-type : [inline_inputs - horizontally inputs ] [ otherwise - vertically inputs]
 */

angular.module('mermaid.forms').directive('numberinput', [
  '$compile',
  '$timeout',
  'utils',

  function($compile, $timeout, utils) {
    'use strict';
    return {
      restrict: 'EA',
      replace: true,
      transclude: {
        validations: '?validations'
      },
      require: 'ngModel',
      scope: {
        ngModel: '=',
        widgetForm: '=',
        widgetRequired: '=?',
        widgetAllowInvalid: '=?',
        widgetDisabled: '=?',
        widgetReadonly: '=?',
        widgetChange: '&',
        widgetType: '@',
        widgetName: '@'
      },
      templateUrl: 'app/_mermaid_common/forms/directives/numberinput.tpl.html',
      link: function(scope, element, attrs, modelCtrl) {
        var INLINE_INPUTS = 'inline_input';
        var validators = [];

        scope.widgetType = (scope.widgetType || 'number').toLowerCase();
        scope.widgetLabel = attrs.widgetLabel;
        scope.widgetAppend = attrs.widgetAppend || null;
        scope.widgetPrepend = attrs.widgetPrepend || null;
        scope.widgetHelp = attrs.widgetHelp || '';
        scope.widgetMinlength = attrs.widgetMinlength || null;
        scope.widgetMaxlength = attrs.widgetMaxlength || null;
        scope.widgetPlaceholder = attrs.widgetPlaceholder || null;
        scope.widgetChange = scope.widgetChange || null;
        scope.widgetBlur = attrs.widgetBlur || null;
        scope.widgetAllowInvalid = utils.truthy(scope.widgetAllowInvalid);
        scope.widgetDisabled = utils.truthy(scope.widgetDisabled);
        scope.widgetReadonly = utils.truthy(scope.widgetReadonly);
        scope.widgetRequired = utils.truthy(scope.widgetRequired);
        scope.widgetRequiredHide = utils.truthy(attrs.widgetRequiredHide);
        if (attrs.widgetIf == null) {
          scope.widgetIf = true;
        }
        scope.widgetIf = utils.truthy(scope.widgetIf);
        scope.inline_inputs = INLINE_INPUTS;

        if (scope.widgetAppend !== null || scope.widgetPrepend !== null) {
          scope.checkSymbol = 'input symbolinput';
        } else {
          scope.checkSymbol = 'input';
        }

        // Attempt to cast model val as number for view and validators
        modelCtrl.$formatters.push(function(modelValue) {
          if (scope.ngModel != null && modelValue[attrs.widgetName] != null) {
            var castedVal = Number(modelValue[attrs.widgetName]);
            scope.ngModel[attrs.widgetName] = castedVal;
            return castedVal;
          }
          return modelValue;
        });

        $timeout(function() {
          if (attrs.widgetValidators) {
            validators = attrs.widgetValidators.split(',');
            var validatorElement = element.find('input');
            for (var i = 0; i < validators.length; i++) {
              var validator_params = validators[i].split('=');
              var key = validator_params[0];
              validatorElement.attr(key, validator_params.slice(1));
            }
            $compile(validatorElement)(scope);
          }
        });

        $('input[type=number]').on('mousewheel', function() {
          $(this).blur();
        });
      }
    };
  }
]);
