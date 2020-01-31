angular.module('app.project').service('SiteService', [
  '$q',
  'offlineservice',
  'authService',
  'APP_CONFIG',
  '$window',
  'TransectExportService',
  function(
    $q,
    offlineservice,
    authService,
    APP_CONFIG,
    $window,
    TransectExportService
  ) {
    'use strict';

    var save = function(site, options) {
      var projectId = site.project || options.projectId;
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
        return offlineservice
          .ProjectSitesTable(projectId)
          .then(function(table) {
            return table.create(site);
          });
      }
      return site.update();
    };

    var fetchData = function(projectId, siteId) {
      if (siteId == null) {
        return $q.resolve({ project: projectId });
      }
      return offlineservice.ProjectSitesTable(projectId).then(function(table) {
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

    var downloadFieldReport = function(project_id) {
      var token = authService.getToken();
      var report_url = 'projects/' + project_id + '/sites/fieldreport/';
      var url = APP_CONFIG.apiUrl + report_url + '?access_token=' + token;
      $window.open(url);
    };

    const downloadSites = function(projectId) {
      const name = 'sites';
      const headers = [
        'Country',
        'Name',
        'Latitude',
        'Longitude',
        'Reef type',
        'Reef zone',
        'Reef exposure',
        'Notes'
      ];
      return offlineservice
        .ProjectSitesTable(projectId)
        .then(function(table) {
          return table.filter();
        })
        .then(function(records) {
          const content = _.map(records, function(record) {
            return [
              record.$$countries.name,
              record.name,
              record.location.coordinates[1],
              record.location.coordinates[0],
              record.$$reeftypes.name,
              record.$$reefzones.name,
              record.$$reefexposures.name,
              record.notes
            ];
          });
          return TransectExportService.downloadAsCSV(name, headers, content);
        });
    };

    return {
      save: save,
      fetchData: fetchData,
      downloadFieldReport: downloadFieldReport,
      downloadSites: downloadSites
    };
  }
]);
