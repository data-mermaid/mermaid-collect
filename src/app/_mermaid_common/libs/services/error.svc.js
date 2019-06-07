angular.module('mermaid.libs').service('ErrorService', [
  '$q',
  'utils',
  'ErrorRenderer',
  function($q, utils, ErrorRenderer) {
    'use strict';

    var alertPromise;

    var errorHandler = function(error) {
      // Don't let the user be inundated with
      // a flurry of error alerts
      if (alertPromise) {
        console.error(error);
      } else {
        // Ignore 401
        if (error && (error.status === 401 || error.status === -1)) {
          return $q.reject(error);
        }
        var msg = ErrorRenderer.render(error);
        alertPromise = utils
          .showAlert('Error', msg, utils.statuses.error, 5000)
          .then(function() {
            alertPromise = null;
          });
      }
      return $q.reject(error);
    };

    return {
      errorHandler: errorHandler
    };
  }
]);
