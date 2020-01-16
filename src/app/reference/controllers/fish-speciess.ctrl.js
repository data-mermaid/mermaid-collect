angular.module('app.reference').controller('FishSpeciessCtrl', [
  '$rootScope',
  '$scope',
  '$filter',
  '$q',
  'PaginatedOfflineTableWrapper',
  'offlineservice',
  function(
    $rootScope,
    $scope,
    $filter,
    $q,
    PaginatedOfflineTableWrapper,
    offlineservice
  ) {
    'use strict';
    $scope.resource = null;
    $scope.tableControl = {};
    let fishSpeciesRecordsCount = 0;

    const promiseFishGeneraTable = offlineservice
      .FishGeneraTable()
      .then(function(table) {
        return table.filter().then(function(records) {
          $scope.tableControl.fishgenera = records;
        });
      });

    $scope.tableConfig = {
      id: 'fishspecies',
      defaultSortByColumn: 'name',
      searching: true,
      searchPlaceholder: 'Filter fish species by name or genus',
      searchLocation: 'left',
      cols: [
        {
          name: 'name',
          display: 'Name',
          sortable: true,
          sort_by: ['$$fishgenera.name', 'name'],
          tdTemplate:
            '<a ui-sref="app.reference.fishspeciess.fishspecies({id: record.id})">{{record.display_name}}</a>'
        },
        {
          name: 'genus',
          display: 'Genus',
          sortable: true,
          sort_by: ['$$fishgenera.name'],
          formatter: function(v) {
            return $filter('matchchoice')(v, $scope.tableControl.fishgenera);
          }
        },
        {
          name: 'biomass_constant_a',
          display: 'Biomass Constant A',
          sortable: false
        },
        {
          name: 'biomass_constant_b',
          display: 'Biomass Constant B',
          sortable: false
        },
        {
          name: 'biomass_constant_c',
          display: 'Biomass Constant C',
          sortable: false
        }
      ],
      toolbar: {
        template: 'app/reference/partials/fish-speciess-toolbar.tpl.html',
        clearFilters: function() {
          $scope.tableControl.clearSearch();
        }
      }
    };

    const updateFishSpeciesCount = function() {
      $scope.projectObjectsTable.count().then(function(count) {
        fishSpeciesRecordsCount = count;
      });
    };

    const promise = offlineservice.FishSpeciesTable();
    $q.all([promise, promiseFishGeneraTable]).then(function(tables) {
      $scope.projectObjectsTable = tables[0];
      updateFishSpeciesCount();
      $scope.resource = new PaginatedOfflineTableWrapper(tables[0], {
        searchFields: ['$$fishgenera.name', 'name']
      });
      $scope.projectObjectsTable.$watch(
        updateFishSpeciesCount,
        null,
        'fishSpeciesRecordsCount'
      );
    });

    $scope.tableControl.getFilteredRecordsCount = function() {
      const tableRecordsTotal =
        $scope.tableControl.getPaginationTable() &&
        $scope.tableControl.getPaginationTable().total;

      return `${tableRecordsTotal}/${fishSpeciesRecordsCount}`;
    };

    $scope.tableControl.recordsNotFiltered = function() {
      if (
        $scope.tableControl.records &&
        $scope.tableControl.records.length !== fishSpeciesRecordsCount
      ) {
        updateFishSpeciesCount();
      }
      return !$scope.tableControl.textboxFilterUsed();
    };

    $rootScope.PageHeaderButtons = [];
  }
]);
