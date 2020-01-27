angular.module('app.reference').service('TransectExportService', [
  '$filter',
  function($filter) {
    'use strict';

    const downloadAsCSV = function(name, header, content) {
      content.unshift(header);
      const csvContent =
        'data:text/csv;charset=utf-8,' +
        content
          .map(function(val) {
            return val.join(',');
          })
          .join('\n');

      const encodedUri = encodeURI(csvContent);
      const downloadLink = document.createElement('a');
      downloadLink.href = encodedUri;
      downloadLink.download = `${name}.csv`;

      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };

    const fishFamiliesReport = function(records) {
      return records.map(function(val) {
        return [val.name];
      });
    };

    const fishGeneraReport = function(records) {
      return records.map(function(val) {
        return [val.name, val.$$fishfamilies.name];
      });
    };

    const fishSpeciessReport = function(records, tableControlRecords, choices) {
      return records.map(function(val) {
        const familyId = $filter('matchchoice')(
          val.genus,
          tableControlRecords.fishgenera,
          'family'
        );

        const genus = $filter('matchchoice')(
          val.genus,
          tableControlRecords.fishgenera
        );
        const species = val.name;
        const family = $filter('matchchoice')(
          familyId,
          tableControlRecords.fishfamilies
        );

        const lengthtypes = $filter('matchchoice')(
          val.max_length_type,
          choices.lengthtypes
        );

        const regions =
          val.regions.length > 0
            ? `"${val.regions.map(function(region) {
                return $filter('matchchoice')(region, choices.regions);
              })}"`
            : '';

        const fishgrouptrophics = $filter('matchchoice')(
          val.trophic_group,
          choices.fishgrouptrophics
        );

        const fishgroupfunctions = $filter('matchchoice')(
          val.functional_group,
          choices.fishgroupfunctions
        );

        const fishgroupsizes = $filter('matchchoice')(
          val.group_size,
          choices.fishgroupsizes
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
    };

    const benthicAttributesReport = function(records, choices) {
      return records.map(function(val) {
        const regionsVal =
          val.regions.length > 0
            ? `"${val.regions.map(function(region) {
                return $filter('matchchoice')(region, choices.regions);
              })}"`
            : '';

        const lifeHistoryVal = val.life_history
          ? $filter('matchchoice')(
              val.life_history,
              choices.benthiclifehistories
            )
          : '';

        return [
          val.name,
          val.$$benthicattributes.name,
          lifeHistoryVal,
          regionsVal
        ];
      });
    };

    return {
      downloadAsCSV: downloadAsCSV,
      fishFamiliesReport: fishFamiliesReport,
      fishGeneraReport: fishGeneraReport,
      fishSpeciessReport: fishSpeciessReport,
      benthicAttributesReport: benthicAttributesReport
    };
  }
]);
