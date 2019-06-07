angular.module('app.project').factory('Project', [
  'APP_CONFIG',
  '$pageresource',
  function(APP_CONFIG, $pageresource) {
    'use strict';
    return $pageresource('projects/:id/', { id: '@id' });
  }
]);
