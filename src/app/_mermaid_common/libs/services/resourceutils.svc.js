angular.module('mermaid.libs').service('resourceutils', [
  '$q',
  function($q) {
    'use strict';
    var resourceutils = {
      // Calculate the number of pages
      // in a paginated response
      //
      // data: should be the initial query response
      pageCount: function(data) {
        var count = data.count;
        var length = data.results.length;
        return count === 0 ? 1 : Math.ceil(count / length);
      },
      all: function(pageresource, limit, filter) {
        filter = filter || {};

        var applyResource = function(records) {
          return _.map(records, function(rec) {
            return angular.merge(new pageresource(), rec);
          });
        };

        var records = [];
        var qry_params = angular.merge({ page: 1, limit: limit }, filter);
        return pageresource.query(qry_params).$promise.then(function(data) {
          records = data.results;
          var num_pages = resourceutils.pageCount(data);

          if (num_pages === 1) {
            return applyResource(records);
          }

          var promises = [];
          var concatRecords = function(data) {
            records = records.concat(data.results);
          };
          for (var i = 2; i <= num_pages; i++) {
            qry_params = angular.merge({ page: i, limit: limit }, filter);
            promises.push(
              pageresource.query(qry_params).$promise.then(concatRecords)
            );
          }
          return $q.all(promises).then(function() {
            return applyResource(records);
          });
        });
      }
    };

    return resourceutils;
  }
]);
