angular.module('mermaid.libs').directive('legendSlider', [
  function() {
    'use strict';
    return {
      restrict: 'EA',
      scope: {},
      templateUrl: 'app/_mermaid_common/libs/directives/legend-slider.tpl.html',
      link: function(scope) {
        scope.toggleNav = false;
        scope.selected = true;

        scope.filterLegend = function(item) {
          console.log(item);
        };
      }
    };
  }
]);
