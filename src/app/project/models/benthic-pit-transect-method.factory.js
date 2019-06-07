angular.module('app.project').factory('BenthicPitTransectMethod', [
  'APP_CONFIG',
  '$pageresource',
  function(APP_CONFIG, $pageresource) {
    'use strict';
    return $pageresource(
      'projects/:project_pk/benthicpittransectmethods/:id/',
      {
        project_pk: '@project_pk',
        id: '@id'
      }
    );
  }
]);
