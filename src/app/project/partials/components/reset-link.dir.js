angular.module('app.project').directive('resetLink', function() {
  'use strict';
  return {
    restrict: 'E',
    scope: {
      resetFx: '='
    },
    template: '<a>Reset and Validate</a>',
    link: function(scope, element) {
      element.bind('click', scope.resetFx);
    }
  };
});
