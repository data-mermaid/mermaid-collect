angular.module('mermaid.models').factory('Choice', [
  'APP_CONFIG',
  '$resource',
  function(APP_CONFIG, $resource) {
    'use strict';
    return $resource(APP_CONFIG.apiUrl + 'choices/:id/', { id: '@id' });
  }
]);
