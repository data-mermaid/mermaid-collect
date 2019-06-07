angular.module('app.project').service('ManagementService', [
  '$q',
  'offlineservice',
  'authService',
  'APP_CONFIG',
  '$window',
  function($q, offlineservice, authService, APP_CONFIG, $window) {
    'use strict';

    var save = function(management, options) {
      var projectId = management.project || options.projectId;
      if (projectId == null) {
        return $q.reject('Project not defined');
      }

      if (!management.id) {
        management.project = projectId;
        return offlineservice
          .ProjectManagementsTable(projectId)
          .then(function(table) {
            return table.create(management);
          });
      }
      return management.update();
    };

    var fetchData = function(projectId, managementId) {
      if (managementId == null) {
        return $q.resolve({ project: projectId });
      }
      return offlineservice
        .ProjectManagementsTable(projectId)
        .then(function(table) {
          return table.get(managementId).then(function(management) {
            return management || { project: projectId };
          });
        });
    };

    var downloadFieldReport = function(projectId) {
      var token = authService.getToken();
      var report_url = 'projects/' + projectId + '/managements/fieldreport/';
      var url = APP_CONFIG.apiUrl + report_url + '?access_token=' + token;
      $window.open(url);
    };

    return {
      save: save,
      fetchData: fetchData,
      downloadFieldReport: downloadFieldReport
    };
  }
]);
