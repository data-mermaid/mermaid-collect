/* globals navigator */

angular.module('mermaid.libs').service('connectivity', [
  '$window',
  '$rootScope',
  'localStorageService',
  function($window, $rootScope, localStorageService) {
    'use strict';

    const pingInterval = 30 * 1000; // 30 secs
    let pingId = null;
    let oldPingState = null;
    let pingState = true;
    let isToggleOffline = localStorageService.get('offline-toggle') === true;

    const isOnline = function() {
      return pingState === true && navigator.onLine && isToggleOffline !== true;
    };

    const checkOnline = function() {
      $rootScope.$broadcast('online', isOnline() === true);
    };

    const setToggle = function(val) {
      isToggleOffline = val;

      if (isToggleOffline) {
        localStorageService.set('offline-toggle', true);
        stopPing();
      } else {
        localStorageService.remove('offline-toggle');
        ping();
      }
    };

    const toggleDisabled = function() {
      return pingState === false || (pingState === null && !navigator.onLine);
    };

    const stopPing = function() {
      if (pingId != null) {
        pingId = window.clearTimeout(pingId);
      }
      oldPingState = null;
      pingState = null;
      checkOnline();
    };

    const ping = function() {
      if (!navigator.onLine) {
        stopPing();
        return;
      }

      window
        .ping()
        .then(
          function() {
            oldPingState = pingState;
            pingState = true;
            if (oldPingState != pingState || !isToggleOffline) {
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

    const service = {
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
