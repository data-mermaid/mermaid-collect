angular.module('app.project').factory('UserProjects', [
  'APP_CONFIG',
  '$pageresource',
  function(APP_CONFIG, $pageresource) {
    'use strict';
    return $pageresource('projects/?profile=:profile', { profile: '@profile' });
  }
]);
