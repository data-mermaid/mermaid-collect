angular.module('app.project').service('SiteService', [
  '$q',
  'OfflineTables',
  'TransectExportService',
  function($q, OfflineTables, TransectExportService) {
    'use strict';

    const reportHeader = [
      'Country',
      'Name',
      'Latitude',
      'Longitude',
      'Reef type',
      'Reef zone',
      'Reef exposure',
      'Notes'
    ];

    const save = function(site, options) {
      const projectId = site.project || options.projectId;
      if (projectId == null) {
        return $q.reject('Project not defined');
      }

      if (site.latitude != null && site.longitude != null) {
        site.location = {
          type: 'Point',
          coordinates: [site.longitude, site.latitude]
        };
      }
      if (!site.id) {
        site.project = projectId;
        return OfflineTables.ProjectSitesTable(projectId).then(function(table) {
          return table.create(site);
        });
      }
      return site.update();
    };

    const fetchData = function(projectId, siteId) {
      if (siteId == null) {
        return $q.resolve({ project: projectId });
      }

      return OfflineTables.ProjectSitesTable(projectId).then(function(table) {
        return table.get(siteId).then(function(site) {
          site = site || { project: projectId };

          if (site.location != null) {
            site.latitude = site.location.coordinates[1];
            site.longitude = site.location.coordinates[0];
          }

          return site;
        });
      });
    };

    const downloadFieldReport = function(projectId) {
      return OfflineTables.ProjectSitesTable(projectId)
        .then(function(table) {
          return table.filter();
        })
        .then(function(records) {
          const content = TransectExportService.sitesReport(records);

          return TransectExportService.downloadAsCSV(
            'sites',
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
