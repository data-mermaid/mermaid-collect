angular.module('mermaid.libs').directive('offlineControl', [
  'connectivity',
  function(connectivity) {
    'use strict';
    return {
      restrict: 'E',
      templateUrl:
        'app/_mermaid_common/libs/directives/offline-control.tpl.html',
      link: function(scope) {
        scope.toggleOffline = !connectivity.isOnline;
        scope.switchControl = function() {
          if (scope.toggleOffline) {
            connectivity.stopPing();
          } else {
            connectivity.ping();
          }
        };
      }
    };
  }
]);
