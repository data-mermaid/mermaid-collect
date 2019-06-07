angular.module('mermaid.libs').directive('offlineNotification', [
  'connectivity',
  'ConnectivityFactory',
  function(connectivity, ConnectivityFactory) {
    'use strict';
    return {
      restrict: 'E',
      templateUrl:
        'app/_mermaid_common/layout/partials/offline-border.tpl.html',
      link: function(scope) {
        var conn = new ConnectivityFactory(scope);
        scope.isOffline = !connectivity.isOnline;
        conn.on('offline-notification-dir', function(event) {
          scope.isOffline = event.event !== 'online';
        });
      }
    };
  }
]);
