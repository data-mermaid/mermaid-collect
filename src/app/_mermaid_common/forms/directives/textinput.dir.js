/*
  TextArea parameters

  REQUIRED:

  widget-form: Name of form widget is being used
  widget-name: <input> name
  ng-model: ng-model

  OPTIONAL:

  widget-label: label for input
  widget-help: Small help text added under <select>
  widget-required: ng-required
  widget-disabled: ng-disabled
  widget-allowed-invalid: ng-model-option
  widget-placeholder: text placeholder
  widget-maxlength: ng-maxlength
  widget-minlength: ng-minlength

 */

angular.module('mermaid.forms').directive('textinput', [
  'utils',
  function(utils) {
    'use strict';
    return {
      restrict: 'EA',
      replace: true,
      transclude: {
        validations: '?validations'
      },
      required: 'ngModel',
      scope: {
        ngModel: '=',
        widgetForm: '=',
        widgetRequired: '=?',
        widgetDisabled: '=?',
        widgetAllowInvalid: '=?',
        widgetType: '@',
        widgetName: '@'
      },
      templateUrl: 'app/_mermaid_common/forms/directives/textinput.tpl.html',
      link: function(scope, element, attrs) {
        scope.widgetLabel = attrs.widgetLabel;
        scope.widgetType = (scope.widgetType || 'text').toLowerCase();
        scope.widgetHelp = attrs.widgetHelp || '';
        scope.widgetMinlength = attrs.widgetMinlength || null;
        scope.widgetMaxlength = attrs.widgetMaxlength || null;
        scope.widgetPlaceholder = attrs.widgetPlaceholder || null;
        scope.widgetAllowInvalid = utils.truthy(attrs.widgetAllowInvalid);
        scope.widgetDisabled = scope.widgetDisabled || false;
        scope.widgetRequired = utils.truthy(attrs.widgetRequired);
      }
    };
  }
]);
