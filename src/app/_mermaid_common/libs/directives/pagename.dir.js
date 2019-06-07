angular.module('mermaid.libs').directive('pagename', [
  '$rootScope',
  '$transitions',
  function($rootScope, $transitions) {
    'use strict';
    return {
      restrict: 'AE',
      template: '<div>{{page_name}}</div>',
      link: function(scope) {
        function _get_page_name(state) {
          var pagename = '';
          if (state.data && state.data.title) {
            pagename = state.data.title;
          }
          return pagename;
        }

        scope.page_name = _get_page_name($rootScope.$state.current);
        $transitions.onSuccess({}, function(transition) {
          scope.page_name = _get_page_name(transition.to());
        });
      }
    };
  }
]);
