angular.module('mermaid.libs').directive('submitdir', [
  function() {
    'use strict';
    return {
      restrict: 'EA',
      scope: false,
      templateUrl: 'app/_mermaid_common/libs/directives/submitdir.tpl.html',
      link: function(scope) {
        scope.$watch(
          'tableControl.records',
          function(records) {
            scope.success_rows = [];
            scope.warning_rows = [];
            scope.error_rows = [];
            _.each(records, function(record) {
              var submission_results =
                _.get(record, 'data.submission_results') || {};
              switch (submission_results.status) {
                case 0:
                  scope.error_rows.push(record);
                  break;
                case 1:
                  scope.warning_rows.push(record);
                  break;
                case 2:
                  scope.success_rows.push(record);
                  break;
              }
            });
          },
          true
        );
      }
    };
  }
]);
