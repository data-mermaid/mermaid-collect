angular.module('app.auth').directive('loginInfo', [
  'authService',
  function(authService) {
    'use strict';
    return {
      restrict: 'EA',
      templateUrl: 'app/auth/directives/login-info.tpl.html',
      link: function(scope) {
        authService.getCurrentUser().then(function(currentUser) {
          scope.user = currentUser;
        });
      }
    };
  }
]);
