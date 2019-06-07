angular.module('mermaid.libs').directive('hoverinfo', [
  function() {
    'use strict';
    return {
      restrict: 'EA',
      transclude: true,
      scope: {
        message: '=',
        popoverTitle: '=?',
        placement: '=?'
      },
      template:
        '<span ' +
        ' data-popover-trigger="mouseenter"' +
        ' ng-attr-data-popover-placement="{{placement}}"' +
        ' ng-attr-data-popover-title="{{popoverTitle}}"' +
        ' ng-attr-data-uib-popover-html="popoverMessage"' +
        '><ng-transclude></ng-transclude></span>',
      link: function(scope) {
        scope.placement = scope.placement || 'top';
        scope.popoverTitle = scope.popoverTitle || '';
        scope.popoverMessage = '';
        function createMessage(msg) {
          var html = '<div>';
          html += '<p>' + msg + '</p>';
          html += '</div>';
          return html;
        }

        scope.$watch('message', function() {
          scope.popoverMessage = createMessage(scope.message);
        });
      }
    };
  }
]);
