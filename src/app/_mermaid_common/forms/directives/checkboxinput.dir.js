/*
  Checkbox parameters

  REQUIRED:

  widget-form: Name of form widget is being used
  widget-name: <input> name
  ng-model: ngModel

  OPTIONAL:
  widget-label: Label name
  widget-disabled: ng-disabled
  widget-if: false to hide

 */

angular.module('mermaid.forms').directive('checkboxinput', [
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
        widgetName: '@',
        widgetChange: '&',
        widgetLabel: '@',
        widgetDescription: '@'
      },
      templateUrl:
        'app/_mermaid_common/forms/directives/checkboxinput.tpl.html',
      link: function(scope, element, attrs) {
        scope.widgetName = attrs.widgetName;
        scope.widgetLabel = attrs.widgetLabel;
        scope.widgetDescription = attrs.widgetDescription;
        scope.widgetDisabled = utils.truthy(scope.widgetDisabled);
      }
    };
  }
]);
