angular.module('app.reference').controller('FishFamiliesCtrl', [
  '$rootScope',
  '$scope',
  'PaginatedOfflineTableWrapper',
  'offlineservice',
  'Button',
  function(
    $rootScope,
    $scope,
    PaginatedOfflineTableWrapper,
    offlineservice,
    Button
  ) {
    'use strict';

    $scope.resource = null;
    $scope.tableControl = {};
    const fieldReportButton = new Button();
    let fishFamilyRecordsCount = 0;

    $scope.tableConfig = {
      id: 'fishfamiles',
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

    const updateFishFamilyCount = function() {
      $scope.projectObjectsTable.count().then(function(count) {
        fishFamilyRecordsCount = count;
      });
    };

    const downloadFieldReport = function() {
      const header = ['Name'];

      $scope.projectObjectsTable.filter().then(function(records) {
        const result = records.map(function(val) {
          return [val.name];
        });
        result.unshift(header);
        const csvContent =
          'data:text/csv;charset=utf-8,' +
          result
            .map(function(val) {
              return val.join(',');
            })
            .join('\n');

        const encodedUri = encodeURI(csvContent);
        const downloadLink = document.createElement('a');
        downloadLink.href = encodedUri;
        downloadLink.download = 'fish-families.csv';

        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      });
    };

    const promise = offlineservice.FishFamiliesTable();
    promise.then(function(table) {
      $scope.projectObjectsTable = table;
      updateFishFamilyCount();
      $scope.resource = new PaginatedOfflineTableWrapper(table, {
        searchFields: ['name']
      });
      $scope.projectObjectsTable.$watch(
        updateFishFamilyCount,
        null,
        'fishFamilyRecordsCount'
      );
    });

    $scope.tableControl.getFilteredRecordsCount = function() {
      const tableRecordsTotal =
        $scope.tableControl.getPaginationTable() &&
        $scope.tableControl.getPaginationTable().total;

      return `${tableRecordsTotal}/${fishFamilyRecordsCount}`;
    };

    $scope.tableControl.recordsNotFiltered = function() {
      if (
        $scope.tableControl.records &&
        $scope.tableControl.records.length !== fishFamilyRecordsCount
      ) {
        updateFishFamilyCount();
      }
      return !$scope.tableControl.textboxFilterUsed();
    };

    fieldReportButton.name = 'Export to CSV';
    fieldReportButton.classes = 'btn-success';
    fieldReportButton.icon = 'fa fa-download';
    fieldReportButton.enabled = true;
    fieldReportButton.click = function() {
      downloadFieldReport();
    };

    $rootScope.PageHeaderButtons = [fieldReportButton];
  }
]);
