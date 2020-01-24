angular.module('mermaid.libs').service('system', [
  '$q',
  '$rootScope',
  '$window',
  '$timeout',
  'OfflineTableUtils',
  'OfflineTables',
  'OfflineCommonTables',
  'connectivity',
  function(
    $q,
    $rootScope,
    $window,
    $timeout,
    OfflineTableUtils,
    OfflineTables,
    OfflineCommonTables,
    connectivity
  ) {
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

    const refreshAll = function() {
      // Check if records are synced
      const projectTablesPromise = OfflineTables.getTableProjectIds()
        .then(function(projectIds) {
          return OfflineTableUtils.checkRemoteProjectStatus(projectIds);
        })
        .then(function(projectStatuses) {
          return $q.all(
            _.map(projectStatuses, function(status, projectId) {
              if (status === false) {
                return OfflineTables.deleteProjectDatabases(projectId, true);
              }
              return OfflineTables.loadProjectRelatedTables(projectId);
            })
          );
        });

      const lookupTablesPromise = OfflineCommonTables.loadLookupTables(false);
      return $q.all([projectTablesPromise, lookupTablesPromise]);
    };

    const createUpdateTimer = function(refresh_rate) {
      if (!isAutoUpdateRunning) {
        return null;
      }

      if (refresh_rate == null) {
        throw 'Refresh rate can not be null.';
      }

      $timeout.cancel(autoDataUpdateId);
      return $timeout(function() {
        refreshAll().then(function() {
          autoDataUpdateId = createUpdateTimer(DATA_REFRESH_RATE);
          $rootScope.$broadcast('localdb:refreshall');
        });
      }, refresh_rate);
    };

    const startAutoDataUpdate = function() {
      if (isAutoUpdateRunning === true) {
        return;
      }
      isAutoUpdateRunning = true;
      autoDataUpdateId = createUpdateTimer(0);
    };

    const stopAutoDataUpdate = function() {
      $timeout.cancel(autoDataUpdateId);
      isAutoUpdateRunning = false;
    };

    const system = {
      reloadPage: function() {
        if (!connectivity.isOnline) {
          console.log("Can't update MERMAID application while offline");
          return;
        }
        $window.location.reload();
      },
      createUpdateTimer: createUpdateTimer,
      refreshAll: refreshAll,
      startAutoDataUpdate: startAutoDataUpdate,
      stopAutoDataUpdate: stopAutoDataUpdate
    };

    return system;
  }
]);
