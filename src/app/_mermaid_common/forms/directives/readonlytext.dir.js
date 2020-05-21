angular.module('mermaid.forms').directive('readonlytext', [
  function() {
    'use strict';
    return {
      restrict: 'EA',
      replace: true,
      required: 'ngModel',
      scope: {
        ngModel: '=',
        attributeChoices: '=?',
        widgetItemList: '=?',
        widgetName: '@'
      },
      templateUrl: 'app/_mermaid_common/forms/directives/readonlytext.tpl.html',
      link: function(scope, element, attrs) {
        scope.widgetLabel = attrs.widgetLabel;
        scope.textType = attrs.widgetTextType || '';
      }
    };
  }
]);
