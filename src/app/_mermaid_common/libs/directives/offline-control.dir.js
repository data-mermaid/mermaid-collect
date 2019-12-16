angular.module('mermaid.libs').directive('offlineControl', [
  'connectivity',
  function(connectivity) {
    'use strict';
    return {
      restrict: 'E',
      templateUrl:
        'app/_mermaid_common/libs/directives/offline-control.tpl.html',
      link: function(scope) {
        scope.toggle = {};
        scope.toggle.offline = false;
        scope.switchControl = function() {
          if (scope.toggle.offline) {
            connectivity.stopPing();
          } else {
            connectivity.ping();
          }
        };
      }
    };
  }
]);
