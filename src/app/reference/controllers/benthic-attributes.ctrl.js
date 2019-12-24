angular.module('app.reference').controller('BenthicAttributesCtrl', [
  '$scope',
  '$rootScope',
  '$state',
  'PaginatedOfflineTableWrapper',
  'Button',
  'offlineservice',
  'utils',
  '$filter',
  function(
    $scope,
    $rootScope,
    $state,
    PaginatedOfflineTableWrapper,
    Button,
    offlineservice,
    utils,
    $filter
  ) {
    'use strict';

    $scope.resource = undefined;
    $scope.tableControl = {};
    let benthicAttributeRecordsCount = 0;

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
        { name: '$$benthicattributes.name', display: 'Parent', sortable: true },
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
            const regions = [];
            _.each(v, function(region) {
              regions.push(
                $filter('matchchoice')(region, utils.choices.regions)
              );
            });
            return regions.join(', ') || '-';
          }
        }
      ],
      toolbar: {
        template: 'app/reference/partials/fish-families-toolbar.tpl.html',
        clearFilters: function() {
          $scope.tableControl.clearSearch();
        }
      }
    };

    const updateBenthicAttributeCount = function() {
      $scope.projectObjectsTable.count().then(function(count) {
        benthicAttributeRecordsCount = count;
      });
    };

    const promise = offlineservice.BenthicAttributesTable();
    promise.then(function(table) {
      $scope.projectObjectsTable = table;
      updateBenthicAttributeCount();
      $scope.resource = new PaginatedOfflineTableWrapper(table, {
        searchFields: ['name', '$$benthicattributes.name']
      });
      $scope.projectObjectsTable.filter().then(function(records) {
        const joinSchema = {
          benthicattributes: {
            foreignKey: 'parent',
            relatedRecords: records,
            relatedKey: 'id',
            relatedColumns: ['name']
          }
        };
        $scope.projectObjectsTable.setJoinDefn(joinSchema);
      });
      $scope.projectObjectsTable.$watch(
        updateBenthicAttributeCount,
        null,
        'benthicAttributeRecordsCount'
      );
    });

    $scope.tableControl.getFilteredRecordsCount = function() {
      const tableRecordsTotal =
        $scope.tableControl.getPaginationTable() &&
        $scope.tableControl.getPaginationTable().total;

      return `${tableRecordsTotal}/${benthicAttributeRecordsCount}`;
    };

    $scope.tableControl.recordsNotFiltered = function() {
      if (
        $scope.tableControl.records &&
        $scope.tableControl.records.length !== benthicAttributeRecordsCount
      ) {
        updateBenthicAttributeCount();
      }
      return !$scope.tableControl.textboxFilterUsed();
    };

    $rootScope.PageHeaderButtons = [];
  }
]);
