angular.module('app.project').directive('submittedMethodLink', [
  '$state',
  '$stateParams',
  'ProjectService',
  function($state, $stateParams, ProjectService) {
    'use strict';
    return {
      restrict: 'E',
      scope: {
        record: '='
      },
      template: `
        <a
          ng-href="{{url}}"
        >{{protocolName}}</a>
      `,
      link: function(scope) {
        const projectId = $stateParams.project_id;
        scope.protocolName = '-';
        scope.url = '';

        const updateLink = function(record) {
          if (record == null) {
            scope.protocolName = '-';
            scope.url = '';
            return;
          }
          const sampleUnitType = _.find(ProjectService.transect_types, {
            id: record.protocol
          });
          console.log(record);
          const state = sampleUnitType.submittedState;
          scope.protocolName = sampleUnitType.name;
          scope.url = $state.href(state, {
            project_id: projectId,
            id: record.id
          });
        };

        scope.$watch('record', function() {
          updateLink(scope.record);
        });
      }
    };
  }
]);
