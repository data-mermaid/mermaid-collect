angular.module('app.reference').controller('FishFamiliesCtrl', [
  '$rootScope',
  '$scope',
  'PaginatedOfflineTableWrapper',
  'TransectExportService',
  'Button',
  'fishFamiliesTable',
  'fishFamiliesCount',
  function(
    $rootScope,
    $scope,
    PaginatedOfflineTableWrapper,
    TransectExportService,
    Button,
    fishFamiliesTable,
    fishFamiliesCount
  ) {
    'use strict';

    $scope.tableControl = {};
    const fieldReportButton = new Button();
    const reportHeader = ['Name'];

    $scope.tableConfig = {
      id: 'mermaid_fishfamiles',
      defaultSortByColumn: 'name',
      searching: true,
      searchPlaceholder: 'Filter fish families by name',
      searchLocation: 'left',
      cols: [
        {
          name: 'name',
          display: 'Name',
          sortable: true,
          sort_by: ['name'],
          tdTemplate:
            '<a ui-sref="app.reference.fishfamilies.fishfamily({id: record.id})">{{record.name}}</a>'
        },
        {
          name: 'biomass_constant_a',
          display: 'Biomass Constant A',
          sortable: true
        },
        {
          name: 'biomass_constant_b',
          display: 'Biomass Constant B',
          sortable: true
        },
        {
          name: 'biomass_constant_c',
          display: 'Biomass Constant C',
          sortable: true
        }
      ],
      toolbar: {
        template: 'app/reference/partials/fish-families-toolbar.tpl.html',
        clearFilters: function() {
          $scope.tableControl.clearSearch();
        }
      }
    };

    $scope.resource = new PaginatedOfflineTableWrapper(fishFamiliesTable, {
      searchFields: ['name']
    });

    const downloadFishFamiliesReport = function() {
      fishFamiliesTable.filter().then(function(records) {
        const content = TransectExportService.fishFamiliesReport(records);

        TransectExportService.downloadAsCSV(
          'fish-families',
          reportHeader,
          content
        );
      });
    };

    $scope.tableControl.getFilteredRecordsCount = function() {
      const tableRecordsTotal = $scope.resource.lastQueryOutput.count;

      return `${tableRecordsTotal}/${fishFamiliesCount}`;
    };

    fieldReportButton.name = 'Export to CSV';
    fieldReportButton.classes = 'btn-success';
    fieldReportButton.icon = 'fa fa-download';
    fieldReportButton.enabled = true;
    fieldReportButton.onlineOnly = false;
    fieldReportButton.click = function() {
      downloadFishFamiliesReport();
    };

    $rootScope.PageHeaderButtons = [fieldReportButton];
  }
]);
