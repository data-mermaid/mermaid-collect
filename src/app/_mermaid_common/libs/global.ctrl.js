angular.module('mermaid.libs').controller('GlobalCtrl', [
  'system',
  '$q',
  '$scope',
  'connectivity',
  'ConnectivityFactory',
  'authService',
  'OfflineTableUtils',
  'OfflineCommonTables',
  'OfflineTables',
  'utils',
  function(
    system,
    $q,
    $scope,
    connectivity,
    ConnectivityFactory,
    authService,
    OfflineTableUtils,
    OfflineCommonTables,
    OfflineTables,
    utils
  ) {
    'use strict';

    const conn = new ConnectivityFactory($scope);

    const deleteDatabases = function() {
      let profileIds = null;
      const projectIdsPromise = OfflineTables.getTableProjectIds();
      const profileIdsPromise = OfflineTableUtils.getTableProfileIds();
      return $q
        .all([projectIdsPromise, profileIdsPromise])
        .then(function(results) {
          if (results == null || results[0] == null || results[1] == null) {
            return $q.reject(
              'Databases cannot be removed, missing profile and project details.'
            );
          }
          const projectIds = results[0];
          profileIds = results[1];
          return $q.all(
            _.map(projectIds, OfflineTables.deleteProjectDatabases)
          );
        })
        .then(function() {
          return OfflineTables.deleteProjectsDatabase();
        })
        .then(function() {
          if (profileIds.length < 2) {
            return OfflineCommonTables.deleteCommonTables();
          }
          return $q.resolve(null);
        });
    };

    const resetLocal = function (lo) {
      return deleteDatabases().finally(function () {
        for (let key in window.localStorage) {
          if (
            key.indexOf('mermaid.') !== -1 &&
            key.indexOf('mermaid.isLoggedIn') === -1 &&
            key.indexOf('mermaid.user') === -1
          ) {
            window.localStorage.removeItem(key);
          }
        }
        if (angular.isDefined(lo) && lo === true) {
          authService.logout();
        }
      });
    };

    /* Handle changes when online and offline*/
    $scope.online = connectivity.isOnline;

    // app initialized var used for app init spinner
    $scope.init = true;

    $scope.copyright = new Date();

    $scope.reloadPage = function() {
      resetLocal().then(function() {
        system.reloadPage();
      });
    };

    $scope.login = authService.login;

    $scope.logout = function() {
      var lo = function() {
        resetLocal(true);
      };
      OfflineTableUtils.isSynced().then(function(is_synced) {
        if (is_synced === false) {
          utils.showConfirmation(
            lo,
            'Logout',
            'You have unsynced records, do you still want to logout?'
          );
        } else {
          lo();
        }
      });
    };

    /********************
     *                   *
     *       EVENTS      *
     *                   *
     *********************/

    $scope.$on('event:auth-loginRequired', function() {
      console.log('login req');
    });

    $scope.$on('event:auth-loginConfirmed', function() {
      console.log('login confirmed');
    });

    conn.on('global', function(event) {
      if (event.event === 'online') {
        $scope.online = true;
        authService.scheduleRenewal();
      } else {
        $scope.online = false;
        authService.cancelScheduleRenewal();
      }
    });
  }
]);
