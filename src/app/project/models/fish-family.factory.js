angular.module('app.project').factory('FishFamily', [
  '$pageresource',
  function($pageresource) {
    'use strict';
    return $pageresource('fishfamilies/:id/', { id: '@id' });
  }
]);
