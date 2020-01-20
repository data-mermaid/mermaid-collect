angular.module('mermaid.libs').controller('GlobalCtrl', [
  'system',
  '$scope',
  'connectivity',
  'ConnectivityFactory',
  'authService',
  'OfflineTableUtils',
  'utils',
  function(
    system,
    $scope,
    connectivity,
    ConnectivityFactory,
    authService,
    OfflineTableUtils,
    utils
  ) {
    'use strict';

    var conn = new ConnectivityFactory($scope);

    /* Handle changes when online and offline*/
    $scope.online = connectivity.isOnline;

    // app initialized var used for app init spinner
    $scope.init = true;

    $scope.copyright = new Date();

    // Unregister workers
    $scope.reloadPage = system.reloadPage;

    $scope.login = authService.login;

    $scope.logout = function() {
      var lo = function() {
        OfflineTableUtils.deleteDatabases().finally(function() {
          authService.logout();
        });
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
