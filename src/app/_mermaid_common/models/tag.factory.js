angular.module('mermaid.models').factory('Tag', [
  'APP_CONFIG',
  '$pageresource',
  function(APP_CONFIG, $pageresource) {
    'use strict';
    return $pageresource('projecttags/');
  }
]);
