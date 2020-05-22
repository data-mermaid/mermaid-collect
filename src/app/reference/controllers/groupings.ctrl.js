angular.module('app.reference').controller('GroupingsCtrl', [
  '$scope',
  'PaginatedOfflineTableWrapper',
  'groupingsTable',
  function($scope, PaginatedOfflineTableWrapper, groupingsTable) {
    'use strict';

    $scope.resource = null;
    $scope.tableControl = {};
    $scope.tableConfig = {
      id: 'mermaid_groupings',
      defaultSortByColumn: 'name',
      searching: true,
      searchPlaceholder: 'Filter groupings by name',
      searchLocation: 'left',
      disableTrackingTableState: true,
      cols: [
        {
          name: 'name',
          display: 'Name',
          sortable: true,
          sort_by: ['name'],
          tdTemplate:
            '<a ui-sref="app.reference.groupings.grouping({id: record.id})">{{record.name}}</a>'
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

    $scope.resource = new PaginatedOfflineTableWrapper(groupingsTable, {
      searchFields: ['name']
    });
  }
]);
