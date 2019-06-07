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

 */

angular.module('mermaid.forms').directive('textareainput', [
  'utils',
  function(utils) {
    'use strict';
    return {
      restrict: 'EA',
      replace: true,
      require: 'ngModel',
      transclude: {
        validations: '?validations'
      },
      scope: {
        ngModel: '=',
        widgetForm: '=',
        widgetDisabled: '=?',
        widgetRequired: '=?',
        widgetName: '@'
      },
      templateUrl:
        'app/_mermaid_common/forms/directives/textareainput.tpl.html',
      link: function(scope, element, attrs) {
        scope.hasFocus = function() {
          if (attrs.widgetFocus) {
            return true;
          }
        };
        scope.widgetLabel = attrs.widgetLabel;
        scope.widgetHelp = attrs.widgetHelp || '';
        scope.widgetDisabled = utils.truthy(scope.widgetDisabled);
        scope.widgetRequired = utils.truthy(scope.widgetRequired);
      }
    };
  }
]);
