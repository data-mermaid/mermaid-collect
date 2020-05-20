angular.module('mermaid.forms').directive('readonlytext', [
  'utils',
  function(utils) {
    'use strict';
    return {
      restrict: 'EA',
      replace: true,
      required: 'ngModel',
      scope: {
        ngModel: '=',
        widgetName: '@'
      },
      templateUrl: 'app/_mermaid_common/forms/directives/readonlytext.tpl.html',
      link: function(scope, element, attrs) {
        scope.widgetLabel = attrs.widgetLabel;
        scope.widgetChoices = attrs.widgetChoices;
      }
    };
  }
]);
