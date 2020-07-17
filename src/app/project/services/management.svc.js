angular.module('app.project').service('ManagementService', [
  '$q',
  'OfflineTables',
  'ProjectService',
  'TransectExportService',
  function($q, OfflineTables, ProjectService, TransectExportService) {
    'use strict';

    const reportHeader = [
      'Name',
      'Secondary name',
      'Year established',
      'Size',
      'Governance',
      'Estimate compliance',
      'Rules',
      'Notes'
    ];

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
        return $q.resolve({ project: projectId, open_access: true });
      }
      return OfflineTables.ProjectManagementsTable(projectId).then(function(
        table
      ) {
        return table.get(managementId).then(function(management) {
          management = management || { project: projectId, open_access: true };
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
          management.access_restriction =
            management.access_restriction === null
              ? false
              : management.access_restriction;
          return management;
        });
      });
    };

    const downloadFieldReport = function(projectId) {
      const managementRecords = OfflineTables.ProjectManagementsTable(
        projectId
      ).then(function(table) {
        return table.filter().then(function(records) {
          return records;
        });
      });
      const choices = ProjectService.fetchChoices();

      return $q.all([managementRecords, choices]).then(function(response) {
        const records = response[0];
        const managementChoices = {
          parties: response[1].managementparties,
          compliances: response[1].managementcompliances
        };

        const content = TransectExportService.managementsReport(
          records,
          managementChoices
        );

        TransectExportService.downloadAsCSV(
          'managements',
          reportHeader,
          content
        );
      });
    };

    return {
      save: save,
      fetchData: fetchData,
      downloadFieldReport: downloadFieldReport
    };
  }
]);
