/* globals navigator */

angular.module('mermaid.libs').service('connectivity', [
  '$window',
  '$rootScope',
  function($window, $rootScope) {
    'use strict';

    var pingInterval = 30 * 1000; // 30 secs
    var pingId = null;
    var oldPingState = null;
    var pingState = true;
    var isToggleOffline = false;

    var isOnline = function() {
      return pingState && navigator.onLine && isToggleOffline === false;
    };

    var checkOnline = function() {
      $rootScope.$broadcast('online', isOnline() === true);
    };

    var setToggle = function(val) {
      isToggleOffline = val;
    };

    var toggleDisabled = function() {
      return navigator.onLine;
    };

    var stopPing = function() {
      if (pingId != null) {
        pingId = window.clearTimeout(pingId);
      }
      oldPingState = null;
      pingState = null;
      checkOnline();
    };

    var ping = function() {
      if (!navigator.onLine) {
        stopPing();
        return;
      }
      if (!isToggleOffline) {
        checkOnline();
      }

      window
        .ping()
        .then(
          function() {
            oldPingState = pingState;
            pingState = true;
            if (oldPingState != pingState) {
              checkOnline();
            }
          },
          function() {
            oldPingState = pingState;
            pingState = false;
            if (oldPingState != pingState) {
              checkOnline();
            }
          }
        )
        .always(function() {
          pingId = window.setTimeout(function() {
            ping();
          }, pingInterval);
        });
    };

    var service = {
      ping: ping,
      stopPing: stopPing,
      setToggle: setToggle,
      toggleDisabled: toggleDisabled
    };

    Object.defineProperty(service, 'isOnline', {
      enumerable: true,
      get: function() {
        return isOnline();
      },
      set: function() {}
    });

    $window.addEventListener(
      'offline',
      function() {
        service.isOnline = false;
        service.stopPing();
      },
      false
    );

    $window.addEventListener(
      'online',
      function() {
        service.ping();
      },
      false
    );
    return service;
  }
]);
