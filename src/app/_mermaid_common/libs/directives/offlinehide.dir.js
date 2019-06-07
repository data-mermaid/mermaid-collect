angular.module('mermaid.libs').directive('offlinehide', [
  'connectivity',
  'ConnectivityFactory',
  'utils',
  function(connectivity, ConnectivityFactory, utils) {
    'use strict';
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        var enableOfflineHide = true;
        var conn = new ConnectivityFactory(scope);

        if (attrs.offlinehide.length > 0) {
          enableOfflineHide = utils.truthy(attrs.offlinehide);
        }

        var setVisibility = function(isVisible) {
          if (enableOfflineHide === false) {
            return;
          }

          if (isVisible) {
            $(element).show();
          } else {
            $(element).hide();
          }
        };

        setVisibility(connectivity.isOnline);

        conn.on(null, function(event) {
          setVisibility(event.event === 'online');
        });
      }
    };
  }
]);
