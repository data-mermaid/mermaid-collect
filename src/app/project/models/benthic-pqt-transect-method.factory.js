angular.module('app.project').factory('BenthicPqtTransectMethod', [
  'APP_CONFIG',
  '$pageresource',
  function(APP_CONFIG, $pageresource) {
    'use strict';
    return $pageresource(
      'projects/:project_pk/benthicphotoquadrattransectmethods/:id/',
      {
        project_pk: '@project_pk',
        id: '@id'
      },
      {
        edit: {
          method: 'PUT',
          url:
            APP_CONFIG.apiUrl +
            'projects/:project_pk/benthicphotoquadrattransectmethods/:id/edit/'
        }
      }
    );
  }
]);
