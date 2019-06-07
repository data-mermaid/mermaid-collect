angular.module('app.project').factory('FishAttribute', [
  '$pageresource',
  function($pageresource) {
    'use strict';
    return $pageresource('fishattributes/:id/', { id: '@id' });
  }
]);
