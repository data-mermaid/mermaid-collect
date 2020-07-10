angular.module('app.project').service('SampleEventService', [
  '$q',
  'OfflineTables',
  function($q, OfflineTables) {
    'use strict';

    const save = function(sample_event, project_id) {
      if (!sample_event.id) {
        return OfflineTables.SampleEventsTable(project_id).then(function(
          table
        ) {
          return table.create(sample_event);
        });
      }
      return sample_event.update();
    };

    const fetchData = function(project_id, sample_event_id) {
      if (sample_event_id === null) {
        return $q.resolve({ project: project_id });
      }

      return OfflineTables.SampleEventsTable(project_id).then(function(table) {
        return table.get(sample_event_id).then(function(sample_event) {
          sample_event = sample_event || { project: project_id };

          return sample_event;
        });
      });
    };

    return {
      save: save,
      fetchData: fetchData
    };
  }
]);