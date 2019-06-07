angular.module('mermaid.libs').directive('methodprotocol', [
  'ProjectService',
  function(ProjectService) {
    'use strict';
    return {
      restrict: 'EA',
      scope: {
        method: '='
      },
      template: '{{methodname}}',
      link: function(scope) {
        var transect_types = ProjectService.transect_types;

        transect_types.forEach(function(transect) {
          if (transect.protocol === scope.method) {
            scope.methodname = transect.name;
          }
        });
      }
    };
  }
]);
