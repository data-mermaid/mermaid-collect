angular.module('app.reference').controller('BenthicAttributesCtrl', [
  '$scope',
  '$rootScope',
  'PaginatedOfflineTableWrapper',
  'Button',
  'TransectExportService',
  '$filter',
  '$q',
  'choicesTable',
  'benthicAttributesTable',
  'benthicAttributesCount',
  function(
    $scope,
    $rootScope,
    PaginatedOfflineTableWrapper,
    Button,
    TransectExportService,
    $filter,
    $q,
    choicesTable,
    benthicAttributesTable,
    benthicAttributesCount
  ) {
    'use strict';

    $scope.tableControl = {};
    const fieldReportButton = new Button();
    const reportHeader = ['Name', 'Parent', 'Life History', 'Regions'];

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
              $filter('matchchoice')(v, choicesTable.benthiclifehistories) ||
              '-'
            );
          }
        },
        {
          name: 'regions',
          display: 'Region List',
          sortable: true,
          formatter: function(v) {
            return (
              _.map(v, function(item) {
                return $filter('matchchoice')(item, choicesTable.regions);
              }).join(', ') || '-'
            );
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
          choicesTable
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
