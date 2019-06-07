angular.module('app.project').factory('ProjectProfile', [
  'APP_CONFIG',
  '$pageresource',
  function(APP_CONFIG, $pageresource) {
    'use strict';
    return $pageresource(
      'projects/:project_pk/project_profiles/:id/',
      { project_pk: '@project_pk', id: '@id' },
      {
        create: {
          url: APP_CONFIG.apiUrl + 'projects/:project_pk/project_profiles/'
        }
      }
    );
  }
]);
