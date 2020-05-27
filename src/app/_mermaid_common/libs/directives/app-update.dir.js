angular.module('mermaid.libs').directive('appUpdate', [
  'connectivity',
  'ConnectivityFactory',
  'utils',
  function(connectivity, ConnectivityFactory, utils) {
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
            if (scope.hasUpdates === true) {
              utils.showAlert(
                'Update',
                'New MERMAID version available, please reload page. <button type="button" class="btn btn-sm btn-default" onclick="window.location.reload()">Reload</button>',
                utils.statuses.primary,
                0,
                {
                  id: 'app-update',
                  canClose: false,
                  isFooterAlert: true
                }
              );
            }
          }
        );
      }
    };
  }
]);
