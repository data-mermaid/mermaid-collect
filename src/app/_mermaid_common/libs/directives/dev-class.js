angular.module('mermaid.libs').directive('devClass', [
  'AppMetaService',
  function(AppMetaService) {
    'use strict';
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        var local_version = AppMetaService.local_version;
        if (local_version === 'dev') {
          $(element).addClass(attrs.devClass);
        } else {
          $(element).removeClass(attrs.devClass);
        }
      }
    };
  }
]);
