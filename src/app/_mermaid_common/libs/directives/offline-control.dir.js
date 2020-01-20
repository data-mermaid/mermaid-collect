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
        scope.sliderDisabled = false;

        scope.switchControl = function() {
          if (scope.toggleOffline) {
            connectivity.setToggle(true);
          } else {
            connectivity.setToggle(false);
          }
        };

        conn.on('offline-control', function(event) {
          scope.toggleOffline = event.event !== 'online';
          scope.sliderDisabled =
            event.event === 'offline' && connectivity.toggleDisabled();
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
