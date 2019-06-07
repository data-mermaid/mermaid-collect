angular.module('mermaid.models').factory('Management', [
  'APP_CONFIG',
  '$pageresource',
  function(APP_CONFIG, $pageresource) {
    'use strict';

    return $pageresource('managements/:id/', { id: '@id' });
  }
]);
