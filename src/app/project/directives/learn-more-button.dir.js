angular.module('app.project').directive('learnMoreButton', [
  function() {
    'use strict';
    return {
      restrict: 'EA',
      templateUrl: 'app/project/directives/learn-more-button.tpl.html',
      link: function(scope) {}
    };
  }
]);
