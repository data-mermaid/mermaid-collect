angular.module('mermaid.libs').directive('hoverpopover', [
  function() {
    'use strict';
    return {
      restrict: 'E',
      transclude: true,
      scope: {
        popoverTitle: '=',
        getPopoverSummary: '&'
      },
      template:
        '<span data-popover-trigger="mouseenter" ' +
        'ng-attr-data-popover-placement="{{placement}}" ' +
        'ng-attr-data-popover-title="{{popoverTitle}}" ' +
        'ng-attr-data-uib-popover-html="popoverMessage">' +
        '<ng-transclude></ng-transclude></span>',
      link: function(scope) {
        scope.placement = 'right';
        scope.popoverMessage = '';
        function createMessage(summary) {
          var html =
            '<table class="table table-striped summary-table"><thead></thead><tbody>';
          for (var i = 0; i < summary.length; i++) {
            var entry = summary[i];
            html +=
              '<tr><td>' +
              entry.name +
              '</td><td>' +
              (entry.value || '-') +
              '</td></tr>';
          }
          html += '</tbody></table>';
          return html;
        }

        scope.$watch('popoverSummary', function() {
          var summaryData = scope.getPopoverSummary();
          if (summaryData == null) {
            scope.popoverMessage = '';
            return;
          }
          scope.popoverMessage = createMessage(summaryData);
        });
      }
    };
  }
]);
