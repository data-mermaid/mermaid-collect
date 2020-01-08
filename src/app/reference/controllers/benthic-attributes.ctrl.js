angular.module('app.reference').controller('BenthicAttributesCtrl', [
  '$scope',
  '$rootScope',
  '$state',
  'PaginatedOfflineTableWrapper',
  'Button',
  'offlineservice',
  'utils',
  '$filter',
  '$q',
  function(
    $scope,
    $rootScope,
    $state,
    PaginatedOfflineTableWrapper,
    Button,
    offlineservice,
    utils,
    $filter,
    $q
  ) {
    'use strict';

    $scope.resource = undefined;
    $scope.tableControl = {};

    $scope.tableConfig = {
      id: 'benthicattributes',
      defaultSortByColumn: 'name',
      searching: true,
      searchPlaceholder: 'Filter benthic attributes by name or parent',
      searchLocation: 'left',
      cols: [
        {
          name: 'name',
          display: 'Name',
          sortable: true,
          sort_by: ['name'],
          tdTemplate:
            '<a ui-sref="app.reference.benthicattributes.benthicattribute({id: record.id})">{{record.name}}</a>'
        },
        {
          name: '$$benthicattributes.name',
          display: 'Parent',
          sortable: true,
          formatter: function(v) {
            return v || '-';
          }
        },
        {
          name: 'life_history',
          display: 'Life History',
          sortable: true,
          formatter: function(v) {
            return (
              $filter('matchchoice')(v, utils.choices.benthiclifehistories) ||
              '-'
            );
          }
        },
        {
          name: 'regions',
          display: 'Region List',
          sortable: true,
          formatter: function(v) {
            var regions = [];
            _.each(v, function(region) {
              regions.push(
                $filter('matchchoice')(region, utils.choices.regions)
              );
            });
            return regions.join(', ') || '-';
          }
        }
      ]
    };

    var promise = offlineservice.BenthicAttributesTable();
    promise.then(function(table) {
      table
        .filter()
        .then(function(records) {
          var deferred = $q.defer();
          var joinSchema = {
            benthicattributes: {
              foreignKey: 'parent',
              relatedRecords: records,
              relatedKey: 'id',
              relatedColumns: ['name']
            }
          };
          deferred.resolve(table.setJoinDefn(joinSchema));
          return deferred.promise;
        })
        .then(function() {
          $scope.resource = new PaginatedOfflineTableWrapper(table, {
            searchFields: ['name', '$$benthicattributes.name']
          });
        });
    });

    $rootScope.PageHeaderButtons = [];
  }
]);
