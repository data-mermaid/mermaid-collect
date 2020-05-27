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
    'app.reference',
    'app.sandbox'
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
    loggerProvider,
    APP_CONFIG
  ) {
    const apiUrl = APP_CONFIG.apiUrl;
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
      tokenGetter: [
        'authService',
        function(authService) {
          return authService.getToken();
        }
      ],
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
    $urlRouterProvider.deferIntercept();

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
    $provide.factory('ResponseInterceptor', function() {
      return {
        response: function(response) {
          const url = response.config.url;
          if (!url.startsWith(apiUrl)) {
            return response;
          }

          const apiVersion = response.headers().http_api_version;
          const mermaidApiVersion = _.get(window, 'mermaid.apiVersion');
          const hasUpdates = _.get(window, 'mermaid.hasUpdates');
          const isDiffVersion =
            mermaidApiVersion != null && mermaidApiVersion !== apiVersion;
          if (mermaidApiVersion == null || isDiffVersion) {
            _.set(window, 'mermaid.apiVersion', apiVersion);
            if (!hasUpdates) {
              window.mermaid.hasUpdates = isDiffVersion;
            }
          }
          return response;
        }
      };
    });

    // Add the interceptor to the $httpProvider.
    $httpProvider.interceptors.push('ErrorHttpInterceptor');
    $httpProvider.interceptors.push('ResponseInterceptor');
  })
  .factory('$exceptionHandler', function($injector) {
    return function LoggerExceptionHandler(exception, cause) {
      var logger = $injector.get('logger');
      logger.error('exception', exception, 'cause', cause);
    };
  });
