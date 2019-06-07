angular.module('mermaid.libs').factory('OfflineTableGroup', [
  '$q',
  function($q) {
    'use strict';

    function OfflineTableGroup(name, offlineTables) {
      var self = this;

      self.name = name;

      self.get = function(pk) {
        return $q
          .all(
            _.map(offlineTables, function(offlineTable) {
              return offlineTable.get(pk);
            })
          )
          .then(function(responses) {
            var results = _.compact(responses);
            if (results.length === 1) {
              return results[0];
            }
            return null;
          });
      };

      self.filter = function(qry_args, includeAll) {
        return $q
          .all(
            _.map(offlineTables, function(offlineTable) {
              return offlineTable.filter(qry_args, includeAll);
            })
          )
          .then(function(responses) {
            return _.flatten(responses);
          });
      };

      self.isSynced = function() {
        return $q
          .all(
            _.map(offlineTables, function(offlineTable) {
              return offlineTable.isSynced();
            })
          )
          .then(function(results) {
            console.log('results', results);

            return results.indexOf(false) === -1;
          });
      };

      self.closeDbGroup = function() {
        _.map(offlineTables, function(offlineTable) {
          return offlineTable.db.close();
        });
      };
    }

    return function(name, offlineTables) {
      return new OfflineTableGroup(name, offlineTables);
    };
  }
]);
