/* jshint latedef: false */

angular.module('app.auth').service('authService', [
  'APP_CONFIG',
  'SESSION_ID',
  '$state',
  '$http',
  '$q',
  'angularAuth0',
  'authManager',
  '$timeout',
  'localStorageService',
  'connectivity',
  function authService(
    APP_CONFIG,
    SESSION_ID,
    $state,
    $http,
    $q,
    angularAuth0,
    authManager,
    $timeout,
    localStorageService,
    connectivity
  ) {
    'use strict';

    var mePromise = null;
    var tokenRenewalTimeout;
    var tokenRenewLeeway = 300000; // 5 minutes

    function login(next) {
      if (connectivity.isOnline !== true) {
        console.log("Can't login while offline");
        return $q.resolve();
      }
      var authorizeLogin = $timeout(angularAuth0.authorize, 0);
      return authorizeLogin.then(function() {
        // Fetch so user gets cached locally
        getCurrentUser().then(function() {
          if (next) {
            $state.go(next);
          }
        });
      });
    }

    function getToken() {
      return localStorage.getItem('access_token');
    }

    function setSession(authResult) {
      // Set the time that the access token will expire at
      let expiresAt = JSON.stringify(
        authResult.expiresIn * 1000 + new Date().getTime()
      );
      localStorage.setItem('access_token', authResult.accessToken);
      localStorage.setItem('id_token', authResult.idToken);
      localStorage.setItem('expires_at', expiresAt);

      scheduleRenewal();
    }

    function handleAuthentication() {
      var defer = $q.defer();
      angularAuth0.parseHash(function(err, authResult) {
        if (authResult && authResult.accessToken && authResult.idToken) {
          setSession(authResult);
          authManager.authenticate();
          var toStateRedirect = localStorageService.get('toState');
          var toStateParamsRedirect =
            localStorageService.get('toStateParams') || {};
          localStorageService.remove('toState');
          localStorageService.remove('toStateParams');
          if (toStateRedirect) {
            $state.go(toStateRedirect, toStateParamsRedirect);
          } else {
            $state.go(APP_CONFIG.secure_state);
          }
        } else if (err) {
          login();
          console.error('Error: ' + err.error + '.', err);
        }
        defer.resolve();
      });
      return defer.promise;
    }

    function logout() {
      if (connectivity.isOnline !== true) return;

      // Remove tokens and expiry time from localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('id_token');
      localStorage.removeItem('expires_at');
      localStorage.removeItem('toState');
      localStorage.removeItem('toStateParams');
      authManager.unauthenticate();
      clearTimeout(tokenRenewalTimeout);
      login();
    }

    function isAuthenticated() {
      if (connectivity.isOnline === false) return true;
      // Check whether the current time is past the
      // access token's expiry time
      var expiresAt = JSON.parse(localStorage.getItem('expires_at'));
      return new Date().getTime() < expiresAt;
    }

    function getCurrentUser() {
      var user = localStorageService.get('user') || {};
      user.$session_id = user.$session_id || null;

      if (connectivity.isOnline && user.$session_id !== SESSION_ID) {
        if (mePromise !== null) {
          return mePromise;
        }
        mePromise = $http
          .get(APP_CONFIG.apiUrl + 'me/')
          .then(function(resp) {
            var currentUser = resp.data;
            currentUser.$session_id = SESSION_ID;
            localStorageService.set('user', currentUser);

            return currentUser;
          })
          .finally(function() {
            mePromise = null;
          });
        return mePromise;
      } else if (!connectivity.isOnline || user.$session_id === SESSION_ID) {
        return $q.resolve(user);
      }
      return $q.resolve(null);
    }

    function renewToken() {
      if (connectivity.isOnline === false) return;

      var callback = function(err, result) {
        if (err) {
          console.error(err);
        } else {
          setSession(result);
        }
      };

      angularAuth0.renewAuth(
        {
          audience: window.AUTH0_AUDIENCE,
          redirectUri: window.AUTH0_SILENT_AUTH_REDIRECT,
          usePostMessage: true
        },
        callback
      );
    }

    function cancelScheduleRenewal() {
      console.log('cancel scheduled token renewal');
      clearTimeout(tokenRenewalTimeout);
    }

    function scheduleRenewal() {
      var expiresAt = JSON.parse(localStorage.getItem('expires_at'));
      var delay = expiresAt - Date.now() - tokenRenewLeeway;
      if (delay > 0) {
        tokenRenewalTimeout = setTimeout(function() {
          console.log('renew');
          renewToken();
        }, delay);
      }
    }

    return {
      tokenRenewalTimeout: tokenRenewalTimeout,
      getToken: getToken,
      login: login,
      handleAuthentication: handleAuthentication,
      logout: logout,
      isAuthenticated: isAuthenticated,
      getCurrentUser: getCurrentUser,
      scheduleRenewal: scheduleRenewal,
      cancelScheduleRenewal: cancelScheduleRenewal,
      renewToken: renewToken
    };
  }
]);
