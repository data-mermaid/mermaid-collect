/*
YesNoDDL parameters

  REQUIRED:

  widget-form: Name of form widget is being used
  widget-name: <input> name
  ng-model: ng-model

  OPTIONAL:

  widget-help: Small help text added under <select>
  widget-required: ng-required
  widget-disabled: true or false
  widget-change: ng-change

*/

angular.module('mermaid.forms').directive('yesnoddlinput', [
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
        widgetRequired: '=?',
        widgetDisabled: '=?',
        widgetName: '@'
      },
      templateUrl:
        'app/_mermaid_common/forms/directives/yesnoddlinput.tpl.html',

      link: function(scope, element, attrs) {
        scope.widgetLabel = attrs.widgetLabel;
        scope.widgetHelp = attrs.widgetHelp || '';
        scope.widgetChange = attrs.widgetChange || null;
        scope.widgetDisabled = scope.widgetDisabled || false;
        scope.widgetRequired = utils.truthy(scope.widgetRequired);

        scope.widgetChoices = [];
        if (scope.widgetRequired !== true) {
          scope.widgetChoices.push({ id: null, name: '' });
        }
        scope.widgetChoices.push({ id: true, name: 'Yes' });
        scope.widgetChoices.push({ id: false, name: 'No' });
      }
    };
  }
]);
