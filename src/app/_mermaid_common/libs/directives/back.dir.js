angular.module('mermaid.libs').directive('back', function() {
  'use strict';
  return {
    restrict: 'A',
    link: function(scope, element) {
      element.on('click', function() {
        history.back();
        scope.$apply();
      });
    }
  };
});
