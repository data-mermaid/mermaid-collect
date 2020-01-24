angular.module('mermaid.libs').directive('projectname', [
  '$stateParams',
  'OfflineTables',
  '$q',
  function($stateParams, OfflineTables, $q) {
    'use strict';
    return {
      restrict: 'AE',
      scope: {
        titlelength: '=',
        watchId: '@'
      },
      template:
        '<div class="projectname" title="{{project_name_tooltip}}">{{project_name}}</div>',
      link: function(scope) {
        const maxLength = scope.titlelength || 40;
        const projectId = $stateParams.project_id;

        function ellipsis_middle(str) {
          if (str.length > maxLength) {
            const mid = (maxLength - 3) / 2;
            const leftLength = Math.ceil(mid);
            const rightLength = Math.floor(mid);
            return (
              str.substr(0, leftLength) +
              '...' +
              str.substr(str.length - rightLength)
            );
          }
          return str;
        }

        $q.all([OfflineTables.ProjectsTable()]).then(function(results) {
          const projectTable = results[0];
          const setProjectName = function(rec) {
            scope.project_name = '';
            if (rec != null) {
              scope.project_name_tooltip = rec.name;
              scope.project_name = ellipsis_middle(scope.project_name_tooltip);
            }
          };

          projectTable.get(projectId).then(function(rec) {
            setProjectName(rec);
          });
          projectTable.$watch(
            function(event) {
              if (event.event === 'ot-updaterecord') {
                setProjectName(event.data[0]);
              }
            },
            null,
            scope.watchId
          );
        });
      }
    };
  }
]);
