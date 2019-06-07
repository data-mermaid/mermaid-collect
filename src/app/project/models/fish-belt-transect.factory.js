angular.module('app.project').factory('FishBeltTransect', [
  '$pageresource',
  function($pageresource) {
    'use strict';
    return $pageresource('projects/:project_pk/fishbelttransects/:id/', {
      project_pk: '@project_pk',
      id: '@id'
    });
  }
]);
