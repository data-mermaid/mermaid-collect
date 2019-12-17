angular.module('mermaid.libs').directive('offlineControl', [
  'connectivity',
  'ConnectivityFactory',
  function(connectivity, ConnectivityFactory) {
    'use strict';
    return {
      restrict: 'E',
      templateUrl:
        'app/_mermaid_common/libs/directives/offline-control.tpl.html',
      link: function(scope) {
        const conn = new ConnectivityFactory(scope);
        scope.toggleOffline = !connectivity.isOnline;

        scope.switchControl = function() {
          if (scope.toggleOffline) {
            connectivity.stopPing();
          } else {
            connectivity.ping();
          }
        };

        conn.on('offline-control', function(event) {
          scope.toggleOffline = event.event !== 'online';
        });

        scope.$watch(
          'toggleOffline',
          function(isOffline) {
            scope.toggleTooltip = isOffline
              ? 'Toggle Online'
              : 'Toggle Offline';
          },
          true
        );
      }
    };
  }
]);
