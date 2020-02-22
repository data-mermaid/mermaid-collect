angular.module('app.project').service('ManagementService', [
  '$q',
  'OfflineTables',
  'authService',
  'APP_CONFIG',
  '$window',
  function($q, OfflineTables, authService, APP_CONFIG, $window) {
    'use strict';

    var save = function(management, options) {
      var projectId = management.project || options.projectId;
      if (projectId == null) {
        return $q.reject('Project not defined');
      }

      if (!management.id) {
        management.project = projectId;
        return OfflineTables.ProjectManagementsTable(projectId).then(function(
          table
        ) {
          return table.create(management);
        });
      }
      return management.update();
    };

    var fetchData = function(projectId, managementId) {
      if (managementId == null) {
        return $q.resolve({ project: projectId });
      }
      return OfflineTables.ProjectManagementsTable(projectId).then(function(
        table
      ) {
        return table.get(managementId).then(function(management) {
          management.no_take =
            management.no_take === null ? false : management.no_take;
          management.open_access =
            management.open_access === null ? false : management.open_access;
          management.periodic_closure =
            management.periodic_closure === null
              ? false
              : management.periodic_closure;
          management.size_limits =
            management.size_limits === null ? false : management.size_limits;
          management.gear_restriction =
            management.gear_restriction === null
              ? false
              : management.gear_restriction;
          management.species_restriction =
            management.species_restriction === null
              ? false
              : management.species_restriction;
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
