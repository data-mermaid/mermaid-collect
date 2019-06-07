angular.module('app.project').factory('ProjectManagement', [
  'APP_CONFIG',
  '$pageresource',
  function(APP_CONFIG, $pageresource) {
    'use strict';
    return $pageresource('projects/:project_pk/managements/:id/', {
      project_pk: '@project_pk',
      id: '@id'
    });
  }
]);
