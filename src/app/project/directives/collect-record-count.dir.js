angular.module('app.project').directive('collectRecordCount', [
  '$q',
  '$stateParams',
  'offlineservice',
  'ProjectService',
  function($q, $stateParams, offlineservice, ProjectService) {
    'use strict';
    return {
      restrict: 'EA',
      template: `<span id="record-count" class="badge badge-pill bg-color-white" ng-style="{'color':'red', 'border':'1px solid red', 'margin-bottom':'5px'}"></span`,
      link: function() {
        const projectId = $stateParams.project_id;
        let collectTable;
        let profile;

        const updateCount = function() {
          collectTable.count({ profile: profile }).then(function(count) {
            $('#record-count').text(count);
          });
        };

        $q.all([
          offlineservice.CollectRecordsTable(projectId),
          ProjectService.getMyProjectProfile(projectId)
        ]).then(function(results) {
          collectTable = results[0];
          profile = _.get(results[1], 'profile');
          updateCount();
          collectTable.$watch(updateCount, null, 'collectRecordCount');
        });
      }
    };
  }
]);
