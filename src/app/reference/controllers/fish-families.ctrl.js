angular.module('app.reference').controller('FishFamiliesCtrl', [
  '$rootScope',
  '$scope',
  'PaginatedOfflineTableWrapper',
  'OfflineTableUtils',
  function(
    $rootScope,
    $scope,
    PaginatedOfflineTableWrapper,
    OfflineTableUtils
  ) {
    'use strict';

    $scope.resource = null;
    $scope.tableControl = {};
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

    const promise = OfflineTableUtils.FishFamiliesTable();
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

    $rootScope.PageHeaderButtons = [];
  }
]);
