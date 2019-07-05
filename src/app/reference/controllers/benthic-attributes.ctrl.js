angular.module('app.reference').controller('BenthicAttributesCtrl', [
  '$scope',
  '$rootScope',
  '$state',
  'PaginatedOfflineTableWrapper',
  'Button',
  'utils',
  '$filter',
  'benthicAttributesTable',
  function(
    $scope,
    $rootScope,
    $state,
    PaginatedOfflineTableWrapper,
    Button,
    utils,
    $filter,
    benthicAttributesTable
  ) {
    'use strict';

    $scope.resource = undefined;
    $scope.tableControl = {};

    $scope.tableConfig = {
      id: 'benthicattributes',
      defaultSortByColumn: 'name',
      searching: true,
      searchPlaceholder: 'Filter benthic attributes by name or parent',
      searchIcon: 'fa-filter',
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

    $scope.resource = new PaginatedOfflineTableWrapper(benthicAttributesTable, {
      searchFields: ['name', '$$benthicattributes.name']
    });
    benthicAttributesTable.filter().then(function(records) {
      var joinSchema = {
        benthicattributes: {
          foreignKey: 'parent',
          relatedRecords: records,
          relatedKey: 'id',
          relatedColumns: ['name']
        }
      };
      benthicAttributesTable.setJoinDefn(joinSchema);
    });

    var add = function() {
      $state.go('app.reference.benthicattribute', { id: '' });
    };

    var addButton = new Button();
    addButton.name = 'Add Attribute';
    addButton.enabled = true;
    addButton.visible = !$scope.isDisabled;
    addButton.classes = 'btn-success';
    addButton.icon = 'fa fa-plus';
    addButton.click = add;

    $rootScope.PageHeaderButtons = [addButton];
  }
]);
