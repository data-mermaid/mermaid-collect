angular.module('mermaid.libs').directive('projectname', [
  'offlineservice',
  '$stateParams',
  function(offlineservice, $stateParams) {
    'use strict';
    return {
      restrict: 'AE',
      scope: {
        titlelength: '=',
        watchId: '@'
      },
      template:
        '<div class="projectname hidden-xs" title="{{project_name_tooltip}}">{{project_name}}</div>',
      link: function(scope) {
        const maxLength = scope.titlelength || 40;
        var project_id = $stateParams.project_id;

        function ellipsis_middle(str) {
          if (str.length > maxLength) {
            var mid = (maxLength - 3) / 2;
            var leftLength = Math.ceil(mid);
            var rightLength = Math.floor(mid);
            return (
              str.substr(0, leftLength) +
              '...' +
              str.substr(str.length - rightLength)
            );
          }
          return str;
        }

        if (!project_id) {
          scope.project_name = null;
        }

        offlineservice.ProjectsTable(project_id, true).then(function(table) {
          var setProjectName = function(rec) {
            if (rec != null) {
              scope.project_name_tooltip = rec.name;
              scope.project_name = ellipsis_middle(scope.project_name_tooltip);
            } else {
              scope.project_name = null;
            }
          };

          table.get(project_id).then(function(rec) {
            setProjectName(rec);
          });
          table.$watch(
            function(event) {
              setProjectName(event.data[0]);
            },
            null,
            scope.watchId
          );
        });
      }
    };
  }
]);
