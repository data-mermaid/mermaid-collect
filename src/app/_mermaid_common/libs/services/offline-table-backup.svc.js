/* globals moment, angular */

angular.module('mermaid.libs').service('OfflineTableBackup', [
  '$q',
  'offlineservice',
  'authService',
  'utils',
  'FileSaver',
  function($q, offlineservice, authService, utils, FileSaver) {
    'use strict';

    var getRecords = function(projectId) {
      return authService.getCurrentUser().then(function(currentUser) {
        return offlineservice
          .CollectRecordsTable(projectId)
          .then(function(table) {
            return table.filter({ profile: currentUser.id }, true);
          });
      });
    };

    var getProjectName = function(projectId) {
      return offlineservice
        .ProjectsTable(projectId)
        .then(function(table) {
          return table.get(projectId);
        })
        .then(function(project) {
          if (project != null) {
            return project.name;
          }
          return null;
        });
    };

    var backup = function(projectId) {
      var name = projectId;
      return getProjectName(projectId)
        .then(function(projectName) {
          if (projectName != null) {
            name = utils.slugify(projectName);
          }
          return getRecords(projectId);
        })
        .then(function(records) {
          if (records.length === 0) {
            return 0;
          }
          var backupRecords = angular.toJson(records);
          var file = new Blob([backupRecords], {
            type: 'application/json;charset=utf-8'
          });
          name += '-' + getTimestampString() + '.json';
          FileSaver.saveAs(file, name);
          return records.length;
        });
    };

    const getTimestampString = function() {
      return moment().format('YYYY-MM-DD[T]HHmmss[Z]ZZ');
    };

    const getTables = function(projectId) {
      const p1 = offlineservice.loadProjectRelatedTables(projectId);
      const p2 = offlineservice.loadLookupTables();
      return $q.all([p1, p2]).then(function(data) {
        return _.flatten(data);
      });
    };

    const backupProject = function(projectId) {
      return getTables(projectId)
        .then(function(tables) {
          const fetchPromises = _.map(tables, function(table) {
            return table.filter(null, true);
          });
          return $q.all(fetchPromises).then(function(data) {
            let n = 0;
            return _.reduce(
              tables,
              function(o, table) {
                o[table.name] = data[n];
                n++;
                return o;
              },
              {}
            );
          });
        })
        .then(function(records) {
          const backupRecords = angular.toJson(records);
          const file = new Blob([backupRecords], {
            type: 'application/json;charset=utf-8'
          });
          const name = projectId + '-' + getTimestampString() + '.json';
          FileSaver.saveAs(file, name);
        });
    };

    return {
      backup: backup,
      backupProject: backupProject
    };
  }
]);
