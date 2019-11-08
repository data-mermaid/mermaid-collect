/* globals moment, angular */

angular.module('mermaid.libs').service('OfflineTableBackup', [
  'offlineservice',
  'authService',
  'utils',
  'FileSaver',
  function(offlineservice, authService, utils, FileSaver) {
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
        .ProjectsTable(true)
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

    var getTimestampString = function() {
      return moment().format('YYYY-MM-DD[T]HHmmss[Z]ZZ');
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

    return {
      backup: backup
    };
  }
]);
