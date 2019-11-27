(function() {
  'use strict';

  angular.module('app').run(run);

  run.$inject = [
    '$rootScope',
    '$state',
    '$stateParams',
    '$transitions',
    '$uibModalStack',
    '$urlRouter',
    'authService',
    'authManager',
    'localStorageService',
    'connectivity',
    'APP_CONFIG',
    'layoutUtils',
    'system',
    'ConnectivityFactory'
  ];

  function run(
    $rootScope,
    $state,
    $stateParams,
    $transitions,
    $uibModalStack,
    $urlRouter,
    authService,
    authManager,
    localStorageService,
    connectivity,
    APP_CONFIG,
    layoutUtils,
    system,
    ConnectivityFactory
  ) {
    let conn = new ConnectivityFactory($rootScope);
    let handleAuth;

    if (authService.getToken() != null) {
      handleAuth = authService.renewToken();
    } else {
      // Handle the authentication
      // result in the hash
      handleAuth = authService.handleAuthentication();
    }

    handleAuth.then(function() {
      if (connectivity.isOnline && authService.isAuthenticated()) {
        system.startAutoDataUpdate();
      }

      $transitions.onStart({}, function(transition) {
        let toState = transition.to();
        let toStateParams = transition.params();

        if (
          toState.loginRequired === true &&
          connectivity.isOnline &&
          !authService.isAuthenticated()
        ) {
          localStorageService.set('toState', toState.name);
          localStorageService.set('toStateParams', toStateParams);
          authService.login();

          return false;
        }
      });

      // $urlRouter.listen();
    });

    // --------------

    $rootScope.$state = $state;
    $rootScope.$stateParams = $stateParams;

    $transitions.onFinish({}, function() {
      $rootScope.GlobalButtons = [];
      $rootScope.PageHeaderButtons = [];
    });

    $transitions.onSuccess({}, function(transition) {
      var fromState = transition.from();
      var toState = transition.to();
      var curState = $rootScope.$state.current;
      var top = $uibModalStack.getTop();

      // handling toggle from clicking the reference book in transect observations look up
      if (_.has(toState.data, 'parentStates')) {
        setTimeout(function() {
          layoutUtils.toggleNav(curState.data.parentStates, fromState.name);
        }, 500);
      } else {
        layoutUtils.toggleNav(curState.name, fromState.name);
      }

      if (top) {
        $uibModalStack.dismiss(top.key);
      }
    });

    $transitions.onError({}, function(transition) {
      var error = transition.error();
      if (angular.isDefined(error.detail)) {
        var errorcode = error.detail.code || null;
        var apperror = _.find(APP_CONFIG.errors, { code: errorcode }) || null;
        if (apperror !== null) {
          var params = {
            rejection: { detail: error.detail.detail },
            apperror: apperror
          };
          $state.go(APP_CONFIG.errorPage, params);
          return false;
        }
      }
    });

    conn.on('autoUpdate', function(evt) {
      if (evt.event === 'online' && authService.isAuthenticated()) {
        system.startAutoDataUpdate();
      } else {
        system.stopAutoDataUpdate();
      }
    });

    authService.scheduleRenewal();
    authManager.checkAuthOnRefresh();
    connectivity.ping();

    // ------//------
  }
})();
