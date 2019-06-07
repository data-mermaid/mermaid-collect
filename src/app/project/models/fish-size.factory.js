angular.module('app.project').factory('FishSize', [
  '$pageresource',
  function($pageresource) {
    'use strict';
    return $pageresource('fishsizes/:id/', { id: '@id' });
  }
]);
