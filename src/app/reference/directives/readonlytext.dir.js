angular.module('app.reference').directive('readonlytext', [
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
        widgetLink: '@',
        widgetName: '@'
      },
      templateUrl: 'app/reference/directives/readonlytext.tpl.html',
      link: function(scope, element, attrs) {
        scope.widgetLabel = attrs.widgetLabel;
        scope.textType = attrs.widgetTextType || '';
      }
    };
  }
]);
