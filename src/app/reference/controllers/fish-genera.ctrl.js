angular.module('app.reference').controller('FishGeneraCtrl', [
  '$rootScope',
  '$scope',
  '$filter',
  'PaginatedOfflineTableWrapper',
  'offlineservice',
  'Button',
  function(
    $rootScope,
    $scope,
    $filter,
    PaginatedOfflineTableWrapper,
    offlineservice,
    Button
  ) {
    'use strict';

    $scope.resource = null;
    $scope.tableControl = {};
    const fieldReportButton = new Button();
    let fishGenusRecordsCount = 0;

    offlineservice.FishFamiliesTable().then(function(table) {
      return table.filter().then(function(records) {
        $scope.fishfamilies = records;
      });
    });

    $scope.tableConfig = {
      id: 'fishgenera',
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
          name: 'family',
          display: 'Family',
          sortable: true,
          sort_by: ['$$fishfamilies.name'],
          formatter: function(v) {
            return $filter('matchchoice')(v, $scope.fishfamilies);
          }
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

    const updateFishGenusCount = function() {
      $scope.projectObjectsTable.count().then(function(count) {
        fishGenusRecordsCount = count;
      });
    };

    const downloadFieldReport = function() {
      const header = ['Name', 'Family'];

      $scope.projectObjectsTable.filter().then(function(records) {
        const result = records.map(function(val) {
          return [val.name, val.$$fishfamilies.name];
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
        downloadLink.download = 'fish-genera.csv';

        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      });
    };

    const promise = offlineservice.FishGeneraTable();
    promise.then(function(table) {
      $scope.projectObjectsTable = table;
      updateFishGenusCount();
      $scope.resource = new PaginatedOfflineTableWrapper(table, {
        searchFields: ['$$fishfamilies.name', 'name']
      });
      $scope.projectObjectsTable.$watch(
        updateFishGenusCount,
        null,
        'fishGenusRecordsCount'
      );
    });

    $scope.tableControl.getFilteredRecordsCount = function() {
      const tableRecordsTotal =
        $scope.tableControl.getPaginationTable() &&
        $scope.tableControl.getPaginationTable().total;

      return `${tableRecordsTotal}/${fishGenusRecordsCount}`;
    };

    $scope.tableControl.recordsNotFiltered = function() {
      if (
        $scope.tableControl.records &&
        $scope.tableControl.records.length !== fishGenusRecordsCount
      ) {
        updateFishGenusCount();
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
