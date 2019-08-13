'use strict';

/**
 * @ngdoc overview
 * @name app [smartadminApp]
 * @description
 * # app [smartadminApp]
 *
 * Main module of the application.
 */

angular
  .module('app', [
    'ngSanitize',
    'ngAnimate',
    'ngResource',
    'auth0.auth0',
    'angular-jwt',
    'ui.router',
    'ui.bootstrap',
    'LocalStorageModule',
    'leaflet-directive',
    'ngFileSaver',
    'blockUI',
    'duScroll',

    // Smartadmin Angular Common Module
    'SmartAdmin',
    'mermaid',

    // App
    'app.auth',
    'app.home',
    'app.layout',
    'app.fulllayout',
    'app.profile',
    'app.project',
    'app.reference'
  ])
  .constant('APP_CONFIG', window.appConfig)
  .constant('SESSION_ID', new Date().getTime())
  .value('ONLINE', true)
  .config(function(
    $provide,
    $httpProvider,
    $urlRouterProvider,
    localStorageServiceProvider,
    $resourceProvider,
    angularAuth0Provider,
    jwtOptionsProvider,
    blockUIConfig,
    loggerProvider
  ) {
    blockUIConfig.templateUrl =
      'app/_mermaid_common/layout/partials/spinner.tpl.html';
    blockUIConfig.autoBlock = false;
    blockUIConfig.autoInjectBodyBlock = true;

    $resourceProvider.defaults.stripTrailingSlashes = false;
    localStorageServiceProvider.setPrefix('mermaid').setNotify(true, true);
    loggerProvider.init({
      level: 'debug',
      loggerUrl: window.appConfig.loggerUrl
    });

    jwtOptionsProvider.config({
      tokenGetter: function() {
        return localStorage.getItem('access_token');
      },
      whiteListedDomains: [
        'localhost',
        'collect.datamermaid.org',
        'api.datamermaid.org',
        'dev-collect.datamermaid.org',
        'dev-api.datamermaid.org'
      ]
    });
    $httpProvider.interceptors.push('jwtInterceptor');

    // Initialization for the angular-auth0 library
    angularAuth0Provider.init({
      clientID: window.appConfig.AUTH0_CLIENT_ID,
      domain: window.appConfig.AUTH0_DOMAIN,
      responseType: 'token id_token',
      audience: window.appConfig.AUTH0_AUDIENCE,
      redirectUri: window.appConfig.AUTH0_CALLBACK_URL
    });

    $urlRouterProvider.otherwise('/projects');

    // Intercept http calls.
    $provide.factory('ErrorHttpInterceptor', function($q, $injector) {
      var loginPromise;
      return {
        requestError: function(rejection) {
          var logger = $injector.get('logger');
          logger.error('requestError', rejection);
          return $q.reject(rejection);
        },
        responseError: function(rejection) {
          if (loginPromise === undefined && rejection.status === 401) {
            var authSvc = $injector.get('authService');
            loginPromise = authSvc.login();
            return $q.reject(rejection);
          }

          var logger = $injector.get('logger');
          var errorDetail = _.get(rejection, 'data.detail', '');
          var httpError = { status: rejection.status, detail: errorDetail };
          if (!_.some(window.appConfig.httpErrorWhitelist, httpError)) {
            logger.error('responseError', rejection);
          }
          return $q.reject(rejection);
        }
      };
    });

    // Add the interceptor to the $httpProvider.
    $httpProvider.interceptors.push('ErrorHttpInterceptor');
  })
  .run(function(
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
    ConnectivityFactory,
    ProjectsService
  ) {
    $rootScope.$state = $state;
    $rootScope.$stateParams = $stateParams;
    let conn = new ConnectivityFactory($rootScope);

    $transitions.onFinish({}, function() {
      $rootScope.GlobalButtons = [];
      $rootScope.PageHeaderButtons = [];
    });

    conn.on('autoUpdate', function(evt) {
      if (evt.event === 'online' && authService.isAuthenticated()) {
        system.startAutoDataUpdate();
      } else {
        system.stopAutoDataUpdate();
      }
    });

    authService.handleAuthentication().then(function() {
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

      ProjectsService.showOrphanedProjectsModal();
    });

    authService.scheduleRenewal();
    authManager.checkAuthOnRefresh();
    connectivity.ping();

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

    if (APP_CONFIG.debugState === true) {
      $rootScope.$on('$stateChangeStart', function(event, toState, toParams) {
        console.log(
          '$stateChangeStart to ' +
            toState.name +
            '- fired when the transition begins. toState,toParams : \n',
          toState,
          toParams
        );
      });
      $rootScope.$on('$stateChangeError', function() {
        console.log(
          '$stateChangeError - fired when an error occurs during transition.'
        );
        console.log(arguments);
      });
      $rootScope.$on('$stateChangeSuccess', function(event, toState) {
        console.log(
          '$stateChangeSuccess to ' +
            toState.name +
            '- fired once the state transition is complete.'
        );
      });
      $rootScope.$on('$viewContentLoading', function(event, viewConfig) {
        console.log(
          '$viewContentLoading - view begins loading - dom not rendered',
          viewConfig
        );
      });

      $rootScope.$on('$stateNotFound', function(
        event,
        unfoundState,
        fromState,
        fromParams
      ) {
        console.log(
          '$stateNotFound ' +
            unfoundState.to +
            '  - fired when a state cannot be found by its name.'
        );
        console.log(unfoundState, fromState, fromParams);
      });
    }
  })
  .factory('$exceptionHandler', function($injector) {
    return function LoggerExceptionHandler(exception, cause) {
      var logger = $injector.get('logger');
      logger.error('exception', exception, 'cause', cause);
    };
  });
