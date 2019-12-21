angular.module('app.reference').controller('FishGeneraCtrl', [
  '$rootScope',
  '$scope',
  '$filter',
  'PaginatedOfflineTableWrapper',
  'offlineservice',
  function(
    $rootScope,
    $scope,
    $filter,
    PaginatedOfflineTableWrapper,
    offlineservice
  ) {
    'use strict';

    $scope.resource = null;
    $scope.tableControl = {};
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

    const promise = offlineservice.FishGeneraTable();
    promise.then(function(table) {
      $scope.projectObjectsTable = table;
      $scope.resource = new PaginatedOfflineTableWrapper(table, {
        searchFields: ['$$fishfamilies.name', 'name']
      });
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

    $rootScope.PageHeaderButtons = [];
  }
]);
