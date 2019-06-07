angular.module('app.project').factory('BenthicLitTransectMethod', [
  'APP_CONFIG',
  '$pageresource',
  function(APP_CONFIG, $pageresource) {
    'use strict';
    return $pageresource(
      'projects/:project_pk/benthiclittransectmethods/:id/',
      {
        project_pk: '@project_pk',
        id: '@id'
      }
    );
  }
]);
