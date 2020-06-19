angular.module('app.project').service('SampleEventService', [
  '$q',
  'OfflineTables',
  function($q, OfflineTables) {
    const save = function(sample_event, project_id) {
      console.log('sample event in service ', sample_event);

      if (!sample_event.id) {
        return OfflineTables.SampleEventsTable(project_id).then(function(
          table
        ) {
          // table create with SITE and MANAGEMENT null => need to fix
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
          console.log('sample_event in fetchData ', sample_event);

          return sample_event;
        });
      });
    };

    return {
      save,
      fetchData
    };
  }
]);
