angular.module('app.auth').factory('Profile', [
  'APP_CONFIG',
  '$pageresource',
  function(APP_CONFIG, $pageresource) {
    'use strict';
    return $pageresource('profiles/:id/', { id: '@id' });
  }
]);
