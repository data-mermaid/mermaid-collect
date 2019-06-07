angular.module('app.project').factory('CollectRecord', [
  '$pageresource',
  function($pageresource) {
    'use strict';
    return $pageresource('projects/:project_pk/collectrecords/:id/', {
      project_pk: '@project_pk',
      id: '@id'
    });
  }
]);
