angular.module('mermaid.libs').directive('appUpdate', [
  'connectivity',
  'ConnectivityFactory',
  function(connectivity, ConnectivityFactory) {
    'use strict';
    return {
      restrict: 'E',
      template:
        '<a ' +
        ' ng-show="isOnline"' +
        ' class="link"' +
        " ng-class=\"[{true: '', false: 'disabled'}[isOnline]," +
        " {true: 'bold glow', false: ''}[hasUpdates]]\"" +
        ' title="Update MERMAID App"' +
        ' ng-click="reloadPage()"' +
        '><i class="fa fa-refresh" style="font-size: 1.2em;"></i></a>',
      link: function(scope) {
        var conn = new ConnectivityFactory(scope);
        scope.hasUpdates = false;
        scope.isOnline = connectivity.isOnline;

        conn.on('app-update-dir', function(event) {
          scope.isOnline = event.event === 'online';
        });

        scope.$watch(
          function() {
            return window.mermaid && window.mermaid.hasUpdates;
          },
          function(n) {
            scope.hasUpdates = n === true;
          }
        );
      }
    };
  }
]);
