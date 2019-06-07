angular.module('app.project').factory('BeltFish', [
  '$pageresource',
  function($pageresource) {
    'use strict';
    return $pageresource('projects/:project_pk/beltfishes/:id/', {
      project_pk: '@project_pk',
      id: '@id'
    });
  }
]);
