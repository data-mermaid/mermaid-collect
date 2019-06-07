angular.module('mermaid.libs').directive('profileMenuImage', [
  'authService',
  'localStorageService',
  function(authService, localStorageService) {
    'use strict';
    return {
      restrict: 'EA',
      template: `
        <span class="profile-menu-image" title="{{name}}">
          <i class="fa fa-user fa-small-margin"></i>
          <span class="hide-small-width">{{identifier}}</span>
          <i class="fa fa-angle-down"></i>
        </span>
      `,
      link: function(scope) {
        var user;

        function getInitial(name) {
          if (name && name.length > 0) {
            return name.slice(0, 1);
          }
          return '';
        }

        function getInitials(user) {
          var first = getInitial(user.first_name);
          var last = getInitial(user.last_name);
          var initial = (first + last).toUpperCase();
          if (initial.length === 0) {
            initial = '?';
          }
          return initial;
        }

        function getImage() {
          // Place holder for extracting profile image
          return null;
        }

        function updateNameImage() {
          authService.getCurrentUser().then(function(currentUser) {
            user = currentUser;
            scope.name = (user.first_name || '') + ' ' + (user.last_name || '');
            scope.identifier = getImage(user) || getInitials(user);
          });
        }
        updateNameImage();

        scope.$watch(
          function() {
            return localStorageService.get('user');
          },
          function() {
            updateNameImage();
          },
          true
        );
      }
    };
  }
]);
