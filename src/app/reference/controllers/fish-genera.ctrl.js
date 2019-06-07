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
      searchIcon: 'fa-filter',
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
      ]
    };

    var promise = offlineservice.FishGeneraTable();
    promise.then(function(table) {
      $scope.resource = new PaginatedOfflineTableWrapper(table, {
        searchFields: ['$$fishfamilies.name', 'name']
      });
    });

    $rootScope.PageHeaderButtons = [];
  }
]);
