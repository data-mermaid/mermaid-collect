/*
  Calc section parameters

    widget-label: Widget label
    widget-name: Display name
    widget-calc: Source value property or function
    widget-units: Units of the source value
*/

angular.module('mermaid.forms').directive('calcsectioninput', [
  function() {
    'use strict';
    return {
      restrict: 'EA',
      replace: true,
      scope: {
        widgetName: '@'
      },
      templateUrl:
        'app/_mermaid_common/forms/directives/calcsectioninput.tpl.html',

      link: function(scope, element, attrs) {
        scope.widgetLabel = attrs.widgetLabel;
        scope.widgetName = attrs.widgetName;
        scope.widgetCalc = attrs.widgetCalc;
        scope.widgetUnits = attrs.widgetUnits;
      }
    };
  }
]);
