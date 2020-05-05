angular.module('app.reference').controller('BenthicAttributesCtrl', [
  '$scope',
  '$rootScope',
  'PaginatedOfflineTableWrapper',
  'Button',
  'OfflineCommonTables',
  'TransectExportService',
  '$filter',
  '$q',
  'benthicAttributesTable',
  'benthicAttributesCount',
  function(
    $scope,
    $rootScope,
    PaginatedOfflineTableWrapper,
    Button,
    OfflineCommonTables,
    TransectExportService,
    $filter,
    $q,
    benthicAttributesTable,
    benthicAttributesCount
  ) {
    'use strict';

    $scope.resource = undefined;
    $scope.tableControl = {};
    $scope.choices = { regions: [], benthiclifehistories: [] };
    const fieldReportButton = new Button();
    const reportHeader = ['Name', 'Parent', 'Life History', 'Regions'];

    OfflineCommonTables.ChoicesTable().then(function(table) {
      table.filter({ name: 'regions' }).then(function(region_choices) {
        $scope.choices.regions = region_choices[0].data;
      });
      table
        .filter({ name: 'benthiclifehistories' })
        .then(function(benthiclifehistory_choices) {
          $scope.choices.benthiclifehistories =
            benthiclifehistory_choices[0].data;
        });
    });

    $scope.tableConfig = {
      id: 'mermaid_benthicattributes',
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
              $filter('matchchoice')(v, $scope.choices.benthiclifehistories) ||
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
                $filter('matchchoice')(region, $scope.choices.regions)
              );
            });
            return regions.join(', ') || '-';
          }
        }
      ],
      toolbar: {
        template: 'app/reference/partials/benthicattributes-toolbar.tpl.html',
        clearFilters: function() {
          $scope.tableControl.clearSearch();
        }
      }
    };

    $q.resolve(benthicAttributesTable).then(function(table) {
      table
        .filter()
        .then(function(records) {
          const deferred = $q.defer();
          const joinSchema = {
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

    const downloadBenthicAttributesReport = function() {
      benthicAttributesTable.filter().then(function(records) {
        const content = TransectExportService.benthicAttributesReport(
          records,
          $scope.choices
        );

        TransectExportService.downloadAsCSV(
          'benthic-attributes',
          reportHeader,
          content
        );
      });
    };

    $scope.tableControl.getFilteredRecordsCount = function() {
      const tableRecordsTotal = $scope.resource.lastQueryOutput.count;

      return `${tableRecordsTotal}/${benthicAttributesCount}`;
    };

    fieldReportButton.name = 'Export to CSV';
    fieldReportButton.classes = 'btn-success';
    fieldReportButton.icon = 'fa fa-download';
    fieldReportButton.enabled = true;
    fieldReportButton.onlineOnly = false;
    fieldReportButton.click = function() {
      downloadBenthicAttributesReport();
    };

    $rootScope.PageHeaderButtons = [fieldReportButton];
  }
]);
