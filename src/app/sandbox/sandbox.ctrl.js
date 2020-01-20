angular.module('app.sandbox').controller('SandboxCtrl', [
  '$scope',
  'OfflineTables',
  'OfflineCommonTables',
  function($scope, OfflineTables, OfflineCommonTables) {
    'use strict';
    const projectId = 'ac4083a0-cba4-43e8-9955-982f6e2aa8d7';

    OfflineTables.ProjectsTable()
      .then(function(table) {
        return table.filter();
      })
      .then(function(records) {
        $scope.projects = records;
        console.log('projects:', records);
      });

    OfflineTables.ProjectSitesTable(projectId)
      .then(function(table) {
        console.log('table.name', table.name);

        return table.filter();
      })
      .then(function(records) {
        $scope.sites = records;
        console.log('sites:', records);
      });

    OfflineTables.ProjectManagementsTable(projectId)
      .then(function(table) {
        return table.filter();
      })
      .then(function(records) {
        $scope.managements = records;
        console.log('managements:', records);
      });

    OfflineTables.ProjectProfilesTable(projectId)
      .then(function(table) {
        return table.filter();
      })
      .then(function(records) {
        $scope.projectProfiles = records;
        console.log('projectProfiles:', records);
      });
    OfflineTables.CollectRecordsTable(projectId)
      .then(function(table) {
        return table.filter();
      })
      .then(function(records) {
        $scope.collectRecords = records;
        console.log('collectRecords:', records);
      });

    OfflineCommonTables.ChoicesTable(projectId)
      .then(function(table) {
        return table.filter();
      })
      .then(function(records) {
        console.log('choices:', records);
      });

    OfflineCommonTables.FishSizesTable(projectId)
      .then(function(table) {
        return table.filter();
      })
      .then(function(records) {
        console.log('FishSizesTable:', records);
      });

    OfflineCommonTables.FishFamiliesTable(projectId)
      .then(function(table) {
        return table.filter();
      })
      .then(function(records) {
        console.log('FishFamiliesTable:', records);
      });

    OfflineCommonTables.FishGeneraTable(projectId)
      .then(function(table) {
        return table.filter();
      })
      .then(function(records) {
        console.log('FishGeneraTable:', records);
      });

    OfflineCommonTables.FishSpeciesTable(projectId)
      .then(function(table) {
        return table.filter();
      })
      .then(function(records) {
        console.log('FishSpeciesTable:', records);
      });

    OfflineCommonTables.FishAttributesTable(projectId)
      .then(function(table) {
        return table.filter();
      })
      .then(function(records) {
        console.log('FishAttributesTable:', records);
      });

    setTimeout(function() {
      OfflineCommonTables.ChoicesTable(projectId)
        .then(function(table) {
          return table.filter();
        })
        .then(function(records) {
          console.log('choices second call:', records);
        });
    }, 5000);
  }
]);
