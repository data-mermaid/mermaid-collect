angular.module('app.project').factory('FishSpecies', [
  '$pageresource',
  function($pageresource) {
    'use strict';
    return $pageresource('fishspecies/:id/', { id: '@id' });
  }
]);
