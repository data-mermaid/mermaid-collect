angular.module('app.reference').controller('FishFamiliesCtrl', [
  '$rootScope',
  '$scope',
  'PaginatedOfflineTableWrapper',
  'offlineservice',
  function($rootScope, $scope, PaginatedOfflineTableWrapper, offlineservice) {
    'use strict';

    $scope.resource = null;
    $scope.tableControl = {};

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
      ]
    };

    var promise = offlineservice.FishFamiliesTable();
    promise.then(function(table) {
      $scope.resource = new PaginatedOfflineTableWrapper(table, {
        searchFields: ['name']
      });
    });

    $rootScope.PageHeaderButtons = [];
  }
]);
