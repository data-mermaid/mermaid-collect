angular.module('mermaid.libs').directive('profileMenu', [
  'utils',
  'authService',
  'localStorageService',
  function(utils, authService, localStorageService) {
    'use strict';
    return {
      restrict: 'EA',
      replace: true,
      templateUrl: 'app/_mermaid_common/libs/directives/profile-menu.tpl.html',
      link: function(scope) {
        scope.menu_id = utils.generateUuid();

        var updateName = function() {
          authService.getCurrentUser().then(function(currentUser) {
            if (currentUser == null) {
              scope.name = '-';
            } else {
              scope.name =
                (currentUser.first_name || '') +
                ' ' +
                (currentUser.last_name || '');
            }
          });
        };

        updateName();

        scope.$watch(
          function() {
            return localStorageService.get('user');
          },
          function() {
            updateName();
          },
          true
        );
      }
    };
  }
]);
