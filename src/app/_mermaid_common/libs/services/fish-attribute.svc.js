angular.module('mermaid.libs').service('FishAttributeService', [
  '$q',
  'OfflineCommonTables',
  function($q, OfflineCommonTables) {
    'use strict';
    let PROPOSED_RECORD = 10;
    let FAMILY_RANK = 'family';
    let GENUS_RANK = 'genus';
    let SPECIES_RANK = 'species';

    let saveFishSpecies = function(fishAttribute) {
      let savePromise;
      if (!fishAttribute.id) {
        fishAttribute.status = PROPOSED_RECORD;
        savePromise = OfflineCommonTables.FishSpeciesTable().then(function(
          fishSpeciesTable
        ) {
          return fishSpeciesTable.create(fishAttribute);
        });
      } else {
        savePromise = fishAttribute.update();
      }
      return savePromise;
    };

    let saveFishGenus = function(fishAttribute) {
      let savePromise;
      if (!fishAttribute.id) {
        fishAttribute.status = PROPOSED_RECORD;
        savePromise = OfflineCommonTables.FishGeneraTable().then(function(
          fishGenusTable
        ) {
          return fishGenusTable.create(fishAttribute);
        });
      } else {
        savePromise = fishAttribute.update();
      }
      return savePromise;
    };

    let saveFishFamily = function(fishAttribute) {
      let savePromise;
      if (!fishAttribute.id) {
        fishAttribute.status = PROPOSED_RECORD;
        savePromise = OfflineCommonTables.FishFamiliesTable().then(function(
          fishFamiliesTable
        ) {
          return fishFamiliesTable.create(fishAttribute);
        });
      } else {
        savePromise = fishAttribute.update();
      }
      return savePromise;
    };

    let getFishFamily = function(fishAttributeId, skipRefresh) {
      return OfflineCommonTables.FishFamiliesTable(skipRefresh).then(function(
        table
      ) {
        return table.get(fishAttributeId);
      });
    };

    let getFishGenus = function(fishAttributeId, skipRefresh) {
      return OfflineCommonTables.FishGeneraTable(skipRefresh).then(function(
        table
      ) {
        return table.get(fishAttributeId);
      });
    };

    let getFishSpecies = function(fishAttributeId, skipRefresh) {
      return OfflineCommonTables.FishSpeciesTable(skipRefresh).then(function(
        table
      ) {
        return table.get(fishAttributeId);
      });
    };

    let fetchFishGenera = function(qry, skipRefresh) {
      return OfflineCommonTables.FishGeneraTable(skipRefresh).then(function(
        table
      ) {
        return table.filter(qry);
      });
    };

    let fetchFishFamilies = function(qry, skipRefresh) {
      return OfflineCommonTables.FishFamiliesTable(skipRefresh).then(function(
        table
      ) {
        return table.filter(qry);
      });
    };

    let fetchFishSpecies = function(qry, skipRefresh) {
      return OfflineCommonTables.FishSpeciesTable(skipRefresh).then(function(
        table
      ) {
        return table.filter(qry);
      });
    };

    let setMetadata = function(records) {
      return _.map(records, function(record) {
        record.display_name = record.display_name || record.name;
        if (_.has(record, 'genus')) {
          record.$$taxonomic_rank = SPECIES_RANK;
        } else if (_.has(record, 'family')) {
          record.$$taxonomic_rank = GENUS_RANK;
        } else {
          record.$$taxonomic_rank = FAMILY_RANK;
        }

        return record;
      });
    };

    let fetchFishAttributes = function(qry, skipRefresh) {
      return OfflineCommonTables.FishAttributesTable(skipRefresh)
        .then(function(table) {
          return table.filter(qry);
        })
        .then(function(records) {
          return setMetadata(records);
        });
    };

    let getFishAttributeChoices = function(qry, skipRefresh) {
      return fetchFishAttributes(qry, skipRefresh).then(function(records) {
        return _.reduce(
          records,
          function(obj, record) {
            obj[record.id] = record;
            return obj;
          },
          {}
        );
      });
    };

    return {
      FAMILY_RANK: FAMILY_RANK,
      GENUS_RANK: GENUS_RANK,
      PROPOSED_RECORD: PROPOSED_RECORD,
      SPECIES_RANK: SPECIES_RANK,
      fetchFishAttributes: fetchFishAttributes,
      fetchFishFamilies: fetchFishFamilies,
      fetchFishGenera: fetchFishGenera,
      fetchFishSpecies: fetchFishSpecies,
      getFishAttributeChoices: getFishAttributeChoices,
      saveFishFamily: saveFishFamily,
      getFishFamily: getFishFamily,
      getFishGenus: getFishGenus,
      getFishSpecies: getFishSpecies,
      saveFishGenus: saveFishGenus,
      saveFishSpecies: saveFishSpecies,
      setMetadata: setMetadata
    };
  }
]);
