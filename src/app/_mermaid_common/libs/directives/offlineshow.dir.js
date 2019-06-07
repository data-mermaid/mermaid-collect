angular.module('mermaid.libs').directive('offlineshow', [
  'connectivity',
  'ConnectivityFactory',
  function(connectivity, ConnectivityFactory) {
    'use strict';
    return {
      restrict: 'A',
      link: function(scope, element) {
        var conn = new ConnectivityFactory(scope);
        var setVisibility = function(isVisible) {
          if (isVisible) {
            $(element).show();
          } else {
            $(element).hide();
          }
        };

        setVisibility(connectivity.isOnline !== true);

        conn.on(null, function(event) {
          setVisibility(event.event !== 'online');
        });
      }
    };
  }
]);
