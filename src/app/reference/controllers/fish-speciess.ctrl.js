angular.module('app.reference').controller('FishSpeciessCtrl', [
  '$rootScope',
  '$scope',
  '$filter',
  'PaginatedOfflineTableWrapper',
  'fishSpeciesTable',
  'fishGenera',
  function(
    $rootScope,
    $scope,
    $filter,
    PaginatedOfflineTableWrapper,
    fishSpeciesTable,
    fishGenera
  ) {
    'use strict';
    $scope.resource = null;
    $scope.tableControl = {
      fishgenera: fishGenera
    };

    $scope.tableConfig = {
      id: 'fishspecies',
      defaultSortByColumn: 'name',
      searching: true,
      searchPlaceholder: 'Filter fish species by name or genus',
      searchIcon: 'fa-filter',
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
      ]
    };
    $scope.resource = new PaginatedOfflineTableWrapper(fishSpeciesTable, {
      searchFields: ['$$fishgenera.name', 'name']
    });

    $rootScope.PageHeaderButtons = [];
  }
]);
