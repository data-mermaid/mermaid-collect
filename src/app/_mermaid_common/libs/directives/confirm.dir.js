/*
  confirm-title:  Dialog title
  confirm-message:  Dialog message
  confirm-fx:  function in scope to execute
 */

angular.module('mermaid.libs').directive('confirm', [
  'utils',
  function(utils) {
    'use strict';
    return {
      restrict: 'A',
      scope: {
        confirmFx: '&',
        confirm: '=?'
      },
      link: function(scope, element, attrs) {
        if (scope.confirm === true || _.isUndefined(scope.confirm)) {
          var title = attrs.confirmTitle || '';
          var message = attrs.confirmMessage || 'Are you sure?';
          var buttons = attrs.confirmButtons || '';
          var fx = function() {
            scope.$apply(function() {
              scope.confirmFx(scope);
            });
          };

          $(element).click(function(e) {
            utils.showConfirmation(fx, title, message, buttons);
            e.preventDefault();
          });
        }
      }
    };
  }
]);
