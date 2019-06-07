angular.module('app.project').factory('BenthicAttribute', [
  '$pageresource',
  function($pageresource) {
    'use strict';
    return $pageresource('benthicattributes/:id/', { id: '@id' });
  }
]);
