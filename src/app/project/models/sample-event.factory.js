angular.module('app.project').factory('SampleEvent', [
  '$pageresource',
  function($pageresource) {
    'use strict';
    return $pageresource('projects/:project_pk/sampleevents/:id/', {
      project_pk: '@project_pk',
      id: '@id'
    });
  }
]);
