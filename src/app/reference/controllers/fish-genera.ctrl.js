angular.module('app.reference').controller('FishGeneraCtrl', [
  '$rootScope',
  '$scope',
  'PaginatedOfflineTableWrapper',
  'TransectExportService',
  'Button',
  'fishGeneraTable',
  'fishGeneraCount',
  function(
    $rootScope,
    $scope,
    PaginatedOfflineTableWrapper,
    TransectExportService,
    Button,
    fishGeneraTable,
    fishGeneraCount
  ) {
    'use strict';

    $scope.tableControl = {};
    const fieldReportButton = new Button();
    const reportHeader = ['Name', 'Family'];

    $scope.tableConfig = {
      id: 'mermaid_fishgenera',
      defaultSortByColumn: 'name',
      searching: true,
      searchPlaceholder: 'Filter fish genera by name or family',
      searchLocation: 'left',
      cols: [
        {
          name: 'name',
          display: 'Name',
          sortable: true,
          sort_by: ['name'],
          tdTemplate:
            '<a ui-sref="app.reference.fishgenera.fishgenus({id: record.id})">{{record.name}}</a>'
        },
        {
          name: '$$fishfamilies.name',
          display: 'Family',
          sortable: true,
          sort_by: ['$$fishfamilies.name']
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
        template: 'app/reference/partials/fish-genera-toolbar.tpl.html',
        clearFilters: function() {
          $scope.tableControl.clearSearch();
        }
      }
    };

    $scope.resource = new PaginatedOfflineTableWrapper(fishGeneraTable, {
      searchFields: ['$$fishfamilies.name', 'name']
    });

    const downloadFishGeneraReport = function() {
      fishGeneraTable.filter().then(function(records) {
        const content = TransectExportService.fishGeneraReport(records);

        TransectExportService.downloadAsCSV(
          'fish-genera',
          reportHeader,
          content
        );
      });
    };

    $scope.tableControl.getFilteredRecordsCount = function() {
      const tableRecordsTotal = $scope.resource.lastQueryOutput.count;

      return `${tableRecordsTotal}/${fishGeneraCount}`;
    };

    fieldReportButton.name = 'Export to CSV';
    fieldReportButton.classes = 'btn-success';
    fieldReportButton.icon = 'fa fa-download';
    fieldReportButton.enabled = true;
    fieldReportButton.onlineOnly = false;
    fieldReportButton.click = function() {
      downloadFishGeneraReport();
    };

    $rootScope.PageHeaderButtons = [fieldReportButton];
  }
]);
