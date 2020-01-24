angular.module('app.reference').controller('FishSpeciessCtrl', [
  '$rootScope',
  '$scope',
  '$filter',
  '$q',
  'PaginatedOfflineTableWrapper',
  'offlineservice',
  'Button',
  function(
    $rootScope,
    $scope,
    $filter,
    $q,
    PaginatedOfflineTableWrapper,
    offlineservice,
    Button
  ) {
    'use strict';
    $scope.resource = null;
    $scope.tableControl = {};
    $scope.choices = {
      regions: [],
      fishgroupfunctions: [],
      fishgrouptrophics: [],
      fishgroupsizes: [],
      lengthtypes: []
    };
    const fieldReportButton = new Button();
    let fishSpeciesRecordsCount = 0;

    offlineservice.FishGeneraTable().then(function(table) {
      return table.filter().then(function(records) {
        $scope.tableControl.fishgenera = records;
      });
    });

    offlineservice.FishFamiliesTable().then(function(table) {
      return table.filter().then(function(records) {
        $scope.tableControl.fishfamilies = records;
      });
    });

    offlineservice.ChoicesTable().then(function(table) {
      table.filter({ name: 'regions' }).then(function(region_choices) {
        $scope.choices.regions = region_choices[0].data;
      });
      table
        .filter({ name: 'fishgroupfunctions' })
        .then(function(fishgroupfunction_choices) {
          $scope.choices.fishgroupfunctions = fishgroupfunction_choices[0].data;
        });
      table
        .filter({ name: 'fishgrouptrophics' })
        .then(function(fishgrouptrophic_choices) {
          $scope.choices.fishgrouptrophics = fishgrouptrophic_choices[0].data;
        });
      table
        .filter({ name: 'fishgroupsizes' })
        .then(function(fishgroupsize_choices) {
          $scope.choices.fishgroupsizes = fishgroupsize_choices[0].data;
        });
      table.filter({ name: 'lengthtypes' }).then(function(lengthtype_choices) {
        $scope.choices.lengthtypes = lengthtype_choices[0].data;
      });
    });

    $scope.tableConfig = {
      id: 'fishspecies',
      defaultSortByColumn: '$$fishgenera.name',
      searching: true,
      searchPlaceholder: 'Filter fish species by name or genus',
      searchLocation: 'left',
      cols: [
        {
          name: 'name',
          display: 'Name',
          sortable: true,
          sort_by: ['name'],
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
      ],
      toolbar: {
        template: 'app/reference/partials/fish-speciess-toolbar.tpl.html',
        clearFilters: function() {
          $scope.tableControl.clearSearch();
        }
      }
    };

    const updateFishSpeciesCount = function() {
      $scope.projectObjectsTable.count().then(function(count) {
        fishSpeciesRecordsCount = count;
      });
    };

    const downloadFieldReport = function() {
      const header = [
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

      $scope.projectObjectsTable.filter().then(function(records) {
        const result = records.map(function(val) {
          const familyId = $filter('matchchoice')(
            val.genus,
            $scope.tableControl.fishgenera,
            'family'
          );

          const genus = $filter('matchchoice')(
            val.genus,
            $scope.tableControl.fishgenera
          );
          const species = val.name;
          const family = $filter('matchchoice')(
            familyId,
            $scope.tableControl.fishfamilies
          );

          const lengthtypes = $filter('matchchoice')(
            val.max_length_type,
            $scope.choices.lengthtypes
          );

          const regions =
            val.regions.length > 0
              ? `"${val.regions.map(function(region) {
                  return $filter('matchchoice')(region, $scope.choices.regions);
                })}"`
              : '';

          const fishgrouptrophics = $filter('matchchoice')(
            val.trophic_group,
            $scope.choices.fishgrouptrophics
          );

          const fishgroupfunctions = $filter('matchchoice')(
            val.functional_group,
            $scope.choices.fishgroupfunctions
          );

          const fishgroupsizes = $filter('matchchoice')(
            val.group_size,
            $scope.choices.fishgroupsizes
          );

          return [
            genus,
            species,
            family,
            val.biomass_constant_a,
            val.biomass_constant_b,
            val.biomass_constant_c,
            val.max_length,
            lengthtypes,
            val.trophic_level,
            val.vulnerability,
            regions,
            val.climate_score,
            fishgrouptrophics,
            fishgroupfunctions,
            fishgroupsizes
          ];
        });

        result.unshift(header);

        const csvContent =
          'data:text/csv;charset=utf-8,' +
          result
            .map(function(val) {
              return val.join(',');
            })
            .join('\n');

        const encodedUri = encodeURI(csvContent);
        const downloadLink = document.createElement('a');
        downloadLink.href = encodedUri;
        downloadLink.download = 'fish-species.csv';

        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      });
    };

    const promise = offlineservice.FishSpeciesTable();
    promise.then(function(tables) {
      $scope.projectObjectsTable = tables;
      updateFishSpeciesCount();
      $scope.resource = new PaginatedOfflineTableWrapper(tables, {
        searchFields: ['$$fishgenera.name', 'name']
      });
      $scope.projectObjectsTable.$watch(
        updateFishSpeciesCount,
        null,
        'fishSpeciesRecordsCount'
      );
    });

    $scope.tableControl.getFilteredRecordsCount = function() {
      const tableRecordsTotal =
        $scope.tableControl.getPaginationTable() &&
        $scope.tableControl.getPaginationTable().total;

      return `${tableRecordsTotal}/${fishSpeciesRecordsCount}`;
    };

    $scope.tableControl.recordsNotFiltered = function() {
      if (
        $scope.tableControl.records &&
        $scope.tableControl.records.length !== fishSpeciesRecordsCount
      ) {
        updateFishSpeciesCount();
      }
      return !$scope.tableControl.textboxFilterUsed();
    };

    fieldReportButton.name = 'Export to CSV';
    fieldReportButton.classes = 'btn-success';
    fieldReportButton.icon = 'fa fa-download';
    fieldReportButton.enabled = true;
    fieldReportButton.onlineOnly = false;
    fieldReportButton.click = function() {
      downloadFieldReport();
    };

    $rootScope.PageHeaderButtons = [fieldReportButton];
  }
]);
