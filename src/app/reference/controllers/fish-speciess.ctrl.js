angular.module('app.reference').controller('FishSpeciessCtrl', [
  '$rootScope',
  '$scope',
  '$q',
  'PaginatedOfflineTableWrapper',
  'OfflineCommonTables',
  'TransectExportService',
  'FishAttributeService',
  'fishSpeciesTable',
  'fishSpeciesCount',
  'Button',
  function(
    $rootScope,
    $scope,
    $q,
    PaginatedOfflineTableWrapper,
    OfflineCommonTables,
    TransectExportService,
    FishAttributeService,
    fishSpeciesTable,
    fishSpeciesCount,
    Button
  ) {
    'use strict';
    $scope.resource = null;
    $scope.tableControl = {};

    const fieldReportButton = new Button();
    const reportHeader = [
      'Genus',
      'Species',
      'Family',
      'Biomass Constant A',
      'Biomass Constant B',
      'Biomass Constant C',
      'Max Length (cm)',
      'Max Length Type',
      'Trophic Level',
      'Vulnerability',
      'Regions',
      'Climate Score',
      'Trophic Group',
      'Functional Group',
      'Group Size'
    ];

    $scope.tableConfig = {
      id: 'mermaid_fishspecies',
      defaultSortByColumn: 'display_name',
      searching: true,
      searchPlaceholder: 'Filter fish species by name or genus',
      searchLocation: 'left',
      cols: [
        {
          name: 'name',
          display: 'Name',
          sortable: true,
          sort_by: ['display_name'],
          tdTemplate:
            '<a ui-sref="app.reference.fishspeciess.fishspecies({id: record.id})">{{record.display_name}}</a>'
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
      ],
      toolbar: {
        template: 'app/reference/partials/fish-speciess-toolbar.tpl.html',
        clearFilters: function() {
          $scope.tableControl.clearSearch();
        }
      }
    };

    $scope.resource = new PaginatedOfflineTableWrapper(fishSpeciesTable, {
      searchFields: ['$$fishgenera.name', 'name']
    });

    const downloadFishSpeciessReport = function() {
      const familiesPromise = FishAttributeService.fetchFishFamilies();
      const generaPromise = FishAttributeService.fetchFishGenera();
      const fishSpeciesPromise = fishSpeciesTable.filter();
      const choicesPromise = OfflineCommonTables.ChoicesTable()
        .then(function(table) {
          return table.filter();
        })
        .then(function(choices) {
          return _.reduce(
            choices,
            function(o, c) {
              o[c.name] = c.data;
              return o;
            },
            {}
          );
        });

      return $q
        .all([
          familiesPromise,
          generaPromise,
          fishSpeciesPromise,
          choicesPromise
        ])
        .then(function(response) {
          const families = response[0];
          const genera = response[1];
          const species = response[2];
          const choices = response[3];

          const content = TransectExportService.fishSpeciessReport(
            species,
            {
              fishfamilies: families,
              fishgenera: genera
            },
            choices
          );

          TransectExportService.downloadAsCSV(
            'fish-species',
            reportHeader,
            content
          );
        });
    };

    $scope.tableControl.getFilteredRecordsCount = function() {
      const tableRecordsTotal = $scope.resource.lastQueryOutput.count;

      return `${tableRecordsTotal}/${fishSpeciesCount}`;
    };

    fieldReportButton.name = 'Export to CSV';
    fieldReportButton.classes = 'btn-success';
    fieldReportButton.icon = 'fa fa-download';
    fieldReportButton.enabled = true;
    fieldReportButton.onlineOnly = false;
    fieldReportButton.click = function() {
      downloadFishSpeciessReport();
    };

    $rootScope.PageHeaderButtons = [fieldReportButton];
  }
]);
