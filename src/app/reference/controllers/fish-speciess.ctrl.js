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

    var promiseFishGeneraTable = offlineservice
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

    var promise = offlineservice.FishSpeciesTable();
    $q.all([promise, promiseFishGeneraTable]).then(function(tables) {
      $scope.resource = new PaginatedOfflineTableWrapper(tables[0], {
        searchFields: ['$$fishgenera.name', 'name']
      });
    });

    $rootScope.PageHeaderButtons = [];
  }
]);
