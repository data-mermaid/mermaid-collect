/*
  Example:
  ordering: '-$mermaid-fishgenera.name,-name'
*/

angular.module('mermaid.libs').factory('PaginatedOfflineTableWrapper', [
  '$q',
  function($q) {
    'use strict';
    return function(offlinetable, options) {
      function PaginatedOfflineTableWrapper(offlinetable, options) {
        var self = this;
        options = options || {};

        self.offlinetable = offlinetable;
        self.searchFields = options.searchFields || [];
        self.sortFields = options.sortFields || {};

        var parseOrdering = function(ordering) {
          if (ordering == null) {
            return null;
          }

          var directions = [];
          var columns = [];

          for (var order_by of ordering.split(',')) {
            var direction = 'asc';
            if (order_by.startsWith('-')) {
              direction = 'desc';
              order_by = order_by.slice(1);
            }
            directions.push(direction);
            if (self.sortFields[order_by]) {
              order_by = self.sortFields[order_by];
            }
            columns.push(order_by);
          }
          return {
            directions: directions,
            columns: columns
          };
        };

        var arraySearchKey = function(record, key, regex) {
          var searchFields = key.split(',');
          var searchVal = _.get(record, searchFields[0]);
          var searchSubKey = _.map(searchVal, function(sub_key) {
            return sub_key[searchFields[1]];
          });
          return regex.test(searchSubKey);
        };

        self.query = function(options) {
          var limit = options.limit || 25;
          var page = options.page || 1;
          var ordering = options.ordering;
          var non_query_keys = ['limit', 'page', 'ordering', 'search'];
          var query_params = _.reduce(
            options,
            function(o, v, k) {
              if (non_query_keys.indexOf(k) === -1) {
                o[k] = v;
              } else if (k === 'search') {
                o[k] = function(empty, record) {
                  var rx = new RegExp(v, 'i');
                  for (var i = 0; i < self.searchFields.length; i++) {
                    var searchFieldKey = self.searchFields[i];

                    if (searchFieldKey.indexOf(',') !== -1) {
                      return arraySearchKey(record, searchFieldKey, rx);
                    } else if (
                      rx.test(_.get(record, searchFieldKey)) === true
                    ) {
                      return true;
                    }
                  }
                  return false;
                };
              }
              return o;
            },
            {}
          );

          var output = {
            count: 0,
            next: null,
            previous: null,
            results: []
          };

          var promises = [
            offlinetable.count(query_params),
            offlinetable.filter(query_params)
          ];

          function filter(records) {
            if (query_params) {
              records = _.filter(records, function(r) {
                for (var k in query_params) {
                  var isFunction = _.isFunction(query_params[k]);
                  if (isFunction && query_params[k](_.get(r, k), r) === false) {
                    return false;
                  } else if (
                    !isFunction &&
                    _.has(r, k) &&
                    r[k] !== query_params[k]
                  ) {
                    return false;
                  }
                }
                return true;
              });
            }

            if (ordering != null) {
              var parsedOrdering = parseOrdering(ordering);
              var directions = parsedOrdering.directions;
              var columns = parsedOrdering.columns;

              records = _.sortByOrder(records, columns, directions);
            }

            // Offset & limit
            var s = limit * (page - 1);
            var e = s + limit;

            return records.slice(s, e);
          }

          return $q.all(promises).then(function(data) {
            output.count = data[0];
            output.results = filter(data[1]);
            if (page * limit < output.count) {
              output.next = true;
            }
            if (page > 1) {
              output.previous = true;
            }
            return output;
          });
        };
      }

      return new PaginatedOfflineTableWrapper(offlinetable, options);
    };
  }
]);
