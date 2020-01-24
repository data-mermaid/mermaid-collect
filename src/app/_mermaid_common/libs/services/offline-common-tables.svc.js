angular.module('mermaid.libs').service('OfflineCommonTables', [
  '$http',
  '$q',
  'OfflineTableUtils',
  'OfflineTableSync',
  'OfflineTableGroup',
  'utils',
  'APP_CONFIG',
  'connectivity',
  'Choice',
  'FishSize',
  'FishFamily',
  'FishGenus',
  'FishSpecies',
  'BenthicAttribute',
  function(
    $http,
    $q,
    OfflineTableUtils,
    OfflineTableSync,
    OfflineTableGroup,
    utils,
    APP_CONFIG,
    connectivity,
    Choice,
    FishSize,
    FishFamily,
    FishGenus,
    FishSpecies,
    BenthicAttribute
  ) {
    'use strict';

    const CHOICES_NAME = 'choices';
    // const FISH_ATTRIBUTES_NAME = 'fishattributes';
    const FISH_SIZES_NAME = 'fishsizes';
    const FISH_FAMILIES_NAME = 'fishfamilies';
    const FISH_GENERA_NAME = 'fishgenera';
    const FISH_SPECIES_NAME = 'fishspecies';
    const BENTHIC_ATTRIBUTES_NAME = 'benthicattributes';
    // const PROJECT_TAGS_NAME = 'projecttags';

    const COMMON_TABLE_NAMES = [
      CHOICES_NAME,
      FISH_SIZES_NAME,
      FISH_FAMILIES_NAME,
      FISH_GENERA_NAME,
      FISH_SPECIES_NAME,
      BENTHIC_ATTRIBUTES_NAME
    ];

    let choicesPromise = null;

    const ChoicesTable = function(skipRefresh) {
      if (choicesPromise !== null) {
        return choicesPromise;
      }

      const updatesUrl = APP_CONFIG.apiUrl + 'choices/updates/';

      const fetchUpdates = function(tableName) {
        return OfflineTableSync.getLastAccessed(tableName).then(function(
          timestamp
        ) {
          timestamp = timestamp || '';
          const url = utils.attachQueryParams(updatesUrl, {
            timestamp: timestamp
          });
          return $http.get(url).then(function(resp) {
            return resp.data;
          });
        });
      };

      const applyUpdates = function(updates, table) {
        const modified = updates.modified || [];
        return table.addRemoteRecords(modified).then(function() {
          return table;
        });
      };

      const refreshChoices = function(table) {
        if (connectivity.isOnline !== true) {
          return $q.resolve(table);
        }

        return fetchUpdates(table.name).then(function(updates) {
          return applyUpdates(updates, table);
        });
      };

      choicesPromise = OfflineTableUtils.createOfflineTable(
        CHOICES_NAME,
        null,
        Choice,
        {
          offlineTablePrimaryKey: 'name',
          isPublic: true
        },
        refreshChoices,
        skipRefresh
      ).finally(function() {
        choicesPromise = null;
      });
      return choicesPromise;
    };

    const FishAttributesTable = function(skipRefresh) {
      return $q
        .all([
          FishSpeciesTable(skipRefresh),
          FishGeneraTable(skipRefresh),
          FishFamiliesTable(skipRefresh)
        ])
        .then(function(responses) {
          return OfflineTableGroup('fishattributes', responses);
        });
    };

    const FishSizesTable = function(skipRefresh) {
      return OfflineTableUtils.createOfflineTable(
        FISH_SIZES_NAME,
        null,
        FishSize,
        {
          updatesUrl: APP_CONFIG.apiUrl + 'fishsizes/updates/',
          isPublic: true
        },
        OfflineTableUtils.paginatedRefresh,
        skipRefresh
      );
    };

    const FishFamiliesTable = function(skipRefresh) {
      return OfflineTableUtils.createOfflineTable(
        FISH_FAMILIES_NAME,
        APP_CONFIG.apiUrl + 'fishfamilies/',
        FishFamily,
        {
          limit: 200,
          isPublic: true
        },
        OfflineTableUtils.paginatedRefresh,
        skipRefresh
      );
    };

    const FishGeneraTable = function(skipRefresh) {
      return OfflineTableUtils.createOfflineTable(
        FISH_GENERA_NAME,
        APP_CONFIG.apiUrl + 'fishgenera/',
        FishGenus,
        {
          joinDefn: {
            fishfamilies: 'family -> mermaid-fishfamilies.id, name'
          },
          limit: 1000,
          isPublic: true
        },
        OfflineTableUtils.paginatedRefresh,
        skipRefresh
      );
    };

    const FishSpeciesTable = function(skipRefresh) {
      const refreshFishSpecies = function(table, options) {
        return table
          .filter({
            status: 10, // PROPOSED_RECORD
            $$synced: false
          })
          .then(function(records) {
            return _.map(records, function(record) {
              if (!record.name || !record.genus) {
                return record.delete(true);
              }
              return $q.resolve();
            });
          })
          .then(function(deletePromises) {
            return $q.all(deletePromises);
          })
          .then(function() {
            return OfflineTableUtils.paginatedRefresh(table, options);
          });
      };

      return OfflineTableUtils.createOfflineTable(
        FISH_SPECIES_NAME,
        APP_CONFIG.apiUrl + 'fishspecies/',
        FishSpecies,
        {
          joinDefn: {
            fishgenera: 'genus -> mermaid-fishgenera.id, name'
          },
          limit: 3000,
          isPublic: true
        },
        refreshFishSpecies,
        skipRefresh
      );
    };

    const BenthicAttributesTable = function(skipRefresh) {
      const refreshBenthicAttributes = function(table, options) {
        return table
          .filter({
            status: 10, // PROPOSED_RECORD
            $$synced: false
          })
          .then(function(records) {
            return _.map(records, function(record) {
              if (!record.name || !record.parent) {
                return record.delete(true);
              }
              return $q.resolve();
            });
          })
          .then(function(deletePromises) {
            return $q.all(deletePromises);
          })
          .then(function() {
            return OfflineTableUtils.paginatedRefresh(table, options);
          });
      };

      return OfflineTableUtils.createOfflineTable(
        BENTHIC_ATTRIBUTES_NAME,
        APP_CONFIG.apiUrl + 'benthicattributes/',
        BenthicAttribute,
        {
          limit: 300,
          isPublic: true
        },
        refreshBenthicAttributes,
        skipRefresh
      );
    };

    const deleteCommonTables = function(force) {
      let tablesPromise;
      if (force) {
        tablesPromise = loadLookupTables(true);
      } else {
        let tables;
        tablesPromise = loadLookupTables()
          .then(function(tableResults) {
            tables = tableResults;
            return OfflineTableUtils.isSynced(tables);
          })
          .then(function() {
            return tables;
          });
      }
      return tablesPromise.then(function(tables) {
        const deletePromises = _.map(tables, function(table) {
          const name = table.name;

          if (table.closeDbGroup) {
            table.closeDbGroup();
          } else {
            table.db.close();
          }
          return OfflineTableUtils.deleteDatabase(name).then(function() {
            return OfflineTableSync.removeLastAccessed(name);
          });
        });
        return $q.all(deletePromises);
      });
    };

    const getTableNames = function(baseNames) {
      let isMulti = true;

      baseNames = baseNames || COMMON_TABLE_NAMES;

      if (angular.isArray(baseNames) === false) {
        baseNames = [baseNames];
        isMulti = false;
      }

      const results = baseNames.map(function(baseName) {
        return `${APP_CONFIG.localDbName}-${baseName}`;
      });
      return isMulti === false ? results[0] : results;
    };

    const loadLookupTables = function(skipRefresh) {
      var promises = [
        ChoicesTable(skipRefresh),
        FishSizesTable(skipRefresh),
        FishAttributesTable(skipRefresh),
        BenthicAttributesTable(skipRefresh),
        FishFamiliesTable(skipRefresh),
        FishGeneraTable(skipRefresh),
        FishSpeciesTable(skipRefresh)
      ];
      return $q.all(promises);
    };

    return {
      COMMON_TABLE_NAMES: COMMON_TABLE_NAMES,
      ChoicesTable: ChoicesTable,
      FishAttributesTable: FishAttributesTable,
      FishSizesTable: FishSizesTable,
      FishFamiliesTable: FishFamiliesTable,
      FishGeneraTable: FishGeneraTable,
      FishSpeciesTable: FishSpeciesTable,
      BenthicAttributesTable: BenthicAttributesTable,
      deleteCommonTables: deleteCommonTables,
      getTableNames: getTableNames,
      loadLookupTables: loadLookupTables
    };
  }
]);
