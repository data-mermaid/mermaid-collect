angular.module('app.project').factory('FishGenus', [
  '$pageresource',
  function($pageresource) {
    'use strict';
    return $pageresource('fishgenera/:id/', { id: '@id' });
  }
]);
