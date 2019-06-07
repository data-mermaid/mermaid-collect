angular.module('mermaid.libs').directive('keyboardsave', [
  function() {
    'use strict';
    return {
      restrict: 'AE',
      scope: {
        saveFunction: '&'
      },
      link: function(scope) {
        function keyboardSave(event) {
          if (
            (event.ctrlKey || event.metaKey) &&
            String.fromCharCode(event.which).toLowerCase() === 's'
          ) {
            event.preventDefault();
            scope.saveFunction();
          }
        }

        window.addEventListener('keydown', keyboardSave);

        scope.$on('$destroy', function() {
          window.removeEventListener('keydown', keyboardSave);
        });
      }
    };
  }
]);
