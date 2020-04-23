angular.module('app.project').factory('FishGrouping', [
  '$pageresource',
  function($pageresource) {
    'use strict';
    return $pageresource('fishgroupings/:id/', { id: '@id' });
  }
]);
