/* jshint latedef: false */

angular.module('app.auth').service('authService', [
  '$q',
  '$state',
  'angularAuth0',
  '$timeout',
  '$http',
  'APP_CONFIG',
  'connectivity',
  'localStorageService',
  function authService(
    $q,
    $state,
    angularAuth0,
    $timeout,
    $http,
    APP_CONFIG,
    connectivity,
    localStorageService
  ) {
    'use strict';

    let accessToken;
    let idToken;
    let expiresAt;
    let mePromise;
    let profileIdPromise;
    let tokenRenewalTimeout;
    let tokenRenewLeeway = 300000; // 5 minutes

    function getIdToken() {
      return idToken;
    }

    function getToken() {
      return accessToken;
    }

    function login() {
      if (connectivity.isOnline !== true) {
        console.log("Can't login while offline");
        return $q.resolve();
      }
      return $timeout(angularAuth0.authorize, 0);
    }

    function handleAuthentication() {
      const defer = $q.defer();
      angularAuth0.parseHash(function(err, authResult) {
        if (authResult && authResult.accessToken && authResult.idToken) {
          localLogin(authResult);
          const toStateRedirect = localStorageService.get('toState');
          const toStateParamsRedirect =
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

    function localLogin(authResult) {
      // Set isLoggedIn flag in localStorage
      localStorageService.set('isLoggedIn', 'true');
      // Set the time that the access token will expire at
      expiresAt = authResult.expiresIn * 1000 + new Date().getTime();

      accessToken = authResult.accessToken;
      idToken = authResult.idToken;
    }

    function renewTokens() {
      const deferred = $q.defer();

      if (connectivity.isOnline === false) {
        deferred.resolve();
      }

      const callback = function(err, result) {
        if (err) {
          console.error(err);
        } else {
          localLogin(result);
        }
        deferred.resolve();
      };

      angularAuth0.checkSession({}, callback);

      return deferred.promise;
    }

    function logout() {
      // Remove isLoggedIn flag from localStorage
      localStorageService.remove('isLoggedIn');
      // Remove tokens and expiry time
      accessToken = '';
      idToken = '';
      expiresAt = 0;

      angularAuth0.logout({
        returnTo: window.location.origin
      });

      login();
    }

    function isAuthenticated() {
      if (connectivity.isOnline === false) return true;

      // Check whether the current time is past the
      // access token's expiry time
      return (
        localStorageService.get('isLoggedIn') === 'true' &&
        new Date().getTime() < expiresAt
      );
    }

    function getCurrentUser() {
      if (isAuthenticated() !== true) {
        return $q.reject('Not authenticated');
      }

      const user = localStorageService.get('user');

      if (connectivity.isOnline && user == null) {
        if (mePromise != null) {
          return mePromise;
        }
        mePromise = $http
          .get(APP_CONFIG.apiUrl + 'me/')
          .then(function(resp) {
            const currentUser = resp.data;
            localStorageService.set('user', currentUser);

            return currentUser;
          })
          .finally(function() {
            mePromise = null;
          });
        return mePromise;
      }
      return $q.resolve(user);
    }

    function getProfileId() {
      if (profileIdPromise != null) {
        return profileIdPromise;
      }

      profileIdPromise = getCurrentUser()
        .then(function(user) {
          return user.id;
        })
        .finally(function() {
          profileIdPromise = null;
        });
      return profileIdPromise;
    }

    function cancelScheduleRenewal() {
      console.log('cancel scheduled token renewal');
      clearTimeout(tokenRenewalTimeout);
    }

    function scheduleRenewal() {
      const expiresAt = JSON.parse(localStorage.getItem('expires_at'));
      const delay = expiresAt - Date.now() - tokenRenewLeeway;
      if (delay > 0) {
        tokenRenewalTimeout = setTimeout(function() {
          console.log('renew');
          renewTokens();
        }, delay);
      }
    }

    return {
      cancelScheduleRenewal: cancelScheduleRenewal,
      getCurrentUser: getCurrentUser,
      getIdToken: getIdToken,
      getProfileId: getProfileId,
      getToken: getToken,
      handleAuthentication: handleAuthentication,
      isAuthenticated: isAuthenticated,
      login: login,
      logout: logout,
      renewTokens: renewTokens,
      scheduleRenewal: scheduleRenewal,
      tokenRenewalTimeout: tokenRenewalTimeout
    };
  }
]);
