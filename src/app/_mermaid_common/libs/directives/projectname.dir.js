angular.module('mermaid.libs').directive('projectname', [
  '$stateParams',
  'OfflineTables',
  function($stateParams, OfflineTables) {
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

        OfflineTables.ProjectsTable().then(function(projectsTable) {
          const setProjectName = function(rec) {
            scope.project_name = '';
            if (rec != null) {
              scope.project_name_tooltip = rec.name;
              scope.project_name = ellipsis_middle(scope.project_name_tooltip);
            }
          };

          projectsTable.get(projectId).then(function(rec) {
            setProjectName(rec);
          });

          projectsTable.$watch(
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
