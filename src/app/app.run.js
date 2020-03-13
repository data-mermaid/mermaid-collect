(function() {
  'use strict';

  angular.module('app').run(run);

  run.$inject = [
    '$rootScope',
    '$state',
    '$stateParams',
    '$transitions',
    '$uibModalStack',
    'authService',
    'authManager',
    'localStorageService',
    'connectivity',
    'APP_CONFIG',
    'layoutUtils',
    'system',
    'offlineservice',
    'utils',
    // '$urlRouter',
    'ConnectivityFactory'
  ];

  function run(
    $rootScope,
    $state,
    $stateParams,
    $transitions,
    $uibModalStack,
    authService,
    authManager,
    localStorageService,
    connectivity,
    APP_CONFIG,
    layoutUtils,
    system,
    offlineservice,
    utils,
    // $urlRouter,
    ConnectivityFactory
  ) {
    const conn = new ConnectivityFactory($rootScope);
    let handleAuth;

    offlineservice.syncAndDeleteV1Tables().catch(function(error) {
      if (error.key) {
        utils.errorAlert(error.message);
      }
      console.error(error);
    });

    if (authService.getToken() != null) {
      handleAuth = authService.renewToken();
    } else {
      // Handle the authentication
      // result in the hash
      handleAuth = authService.handleAuthentication();
    }

    handleAuth.then(function() {
      // $urlRouter.listen();
      if (connectivity.isOnline && authService.isAuthenticated()) {
        system.startAutoDataUpdate();
      }
    });

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
      const error = transition.error();
      if (angular.isDefined(error.detail)) {
        const errorcode =
          error.detail != null ? error.detail.code || null : null;
        const apperror = _.find(APP_CONFIG.errors, { code: errorcode }) || null;
        if (apperror !== null) {
          const params = {
            rejection: { detail: error.detail.detail },
            apperror: apperror
          };
          $state.go(APP_CONFIG.errorPage, params);
          return false;
        } else if (!authService.isAuthenticated()) {
          const toState = transition.to();
          const toStateParams = transition.params();
          localStorageService.set('toState', toState.name);
          localStorageService.set('toStateParams', toStateParams);
          authService.login();
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

    authManager.checkAuthOnRefresh();
    connectivity.ping();
  }
})();
