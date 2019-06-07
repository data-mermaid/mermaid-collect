/*
  ReadOnly parameters

  REQUIRED:

  widget-name: <input> name
  ng-model: ng-model

 */

angular.module('mermaid.forms').directive('readonlyinput', [
  function() {
    'use strict';
    return {
      restrict: 'EA',
      replace: true,
      require: 'ngModel',
      scope: {
        ngModel: '=',
        widgetType: '@',
        widgetName: '@'
      },
      templateUrl:
        'app/_mermaid_common/forms/directives/readonlyinput.tpl.html',
      link: function(scope, element, attrs) {
        scope.widgetLabel = attrs.widgetLabel;
      }
    };
  }
]);
