angular.module('mermaid.models').factory('Site', [
  'APP_CONFIG',
  '$pageresource',
  function(APP_CONFIG, $pageresource) {
    'use strict';
    return $pageresource('sites/:id/', { id: '@id' });
  }
]);
