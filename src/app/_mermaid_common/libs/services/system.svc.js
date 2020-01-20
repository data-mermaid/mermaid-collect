angular.module('mermaid.libs').service('system', [
  '$rootScope',
  '$window',
  '$timeout',
  'OfflineTableUtils',
  'connectivity',
  function($rootScope, $window, $timeout, OfflineTableUtils, connectivity) {
    'use strict';

    var DATA_REFRESH_RATE = 900000; // 15 minutes
    var autoDataUpdateId;
    var isAutoUpdateRunning = false;

    $window.onbeforeunload = function(e) {
      var confirmation = {};
      var event = $rootScope.$broadcast('onBeforeUnload', confirmation);
      if (event.defaultPrevented) {
        e.returnValue = confirmation.message;
        return confirmation.message;
      }
    };

    var createUpdateTimer = function(refresh_rate) {
      if (!isAutoUpdateRunning) {
        return null;
      }

      if (refresh_rate == null) {
        throw 'Refresh rate can not be null.';
      }

      $timeout.cancel(autoDataUpdateId);
      return $timeout(function() {
        OfflineTableUtils.refreshAll().then(function() {
          autoDataUpdateId = createUpdateTimer(DATA_REFRESH_RATE);
          $rootScope.$broadcast('localdb:refreshall');
        });
      }, refresh_rate);
    };

    var startAutoDataUpdate = function() {
      if (isAutoUpdateRunning === true) {
        return;
      }
      isAutoUpdateRunning = true;
      autoDataUpdateId = createUpdateTimer(0);
    };

    var stopAutoDataUpdate = function() {
      $timeout.cancel(autoDataUpdateId);
      isAutoUpdateRunning = false;
    };

    var system = {
      reloadPage: function() {
        if (!connectivity.isOnline) {
          console.log("Can't update MERMAID application while offline");
          return;
        }
        $window.location.reload();
      },
      createUpdateTimer: createUpdateTimer,
      startAutoDataUpdate: startAutoDataUpdate,
      stopAutoDataUpdate: stopAutoDataUpdate
    };

    return system;
  }
]);
