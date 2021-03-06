angular.module('app.project').factory('SampleUnitMethod', [
  'APP_CONFIG',
  '$pageresource',
  function(APP_CONFIG, $pageresource) {
    'use strict';
    return $pageresource('projects/:project_pk/sampleunitmethods/:id/', {
      project_pk: '@project_pk',
      id: '@id'
    });
  }
]);
