angular.module('mermaid.libs').directive('offlineIndicator', [
  'connectivity',
  'ConnectivityFactory',
  function(connectivity, ConnectivityFactory) {
    'use strict';
    return {
      restrict: 'E',
      template: '<span ng-show="isOffline"><span>',
      link: function(scope) {
        var conn = new ConnectivityFactory(scope);
        scope.isOffline = !connectivity.isOnline;
        conn.on('offline-indicator-dir123', function(event) {
          scope.isOffline = event.event !== 'online';
        });
      }
    };
  }
]);
