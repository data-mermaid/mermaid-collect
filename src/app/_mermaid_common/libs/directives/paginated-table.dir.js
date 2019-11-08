/*

  Example usage:

  Controller:

  $scope.tableControl = {};
  $scope.tableConfig = {
    id: 'collect_records',
    hideRowStripes: true/false  // Hide row alternating colors
    resource: PaginatedOfflineTableWrapper(offlinetable),
    searching: false,
    rowSelect: true,
    defaultSortByColumn: 'site',
    cols: [
      {
          name: 'site',
          display: 'Site',
          sortable: true,
          formatter: function(v) {
            return v;
          }
      },
      {
        name: 'timestamp',
        display: 'Timestamp',
        sortable: true,
        formatter: function(v) {
          return $filter('date')(v, 'MM-dd-yyyy HH:mm');
        }
      },
      {
        name: 'protocol',
        display: 'Protocol',
        sortable: true,
        formatter: function(v) {
          return $filter('matchchoice')(v, $scope.transect_types);
        }
      }
    ],
    toolbar: {
      template: 'app/collect/directives/collect-records-toolbar.tpl.html',
      submitSelected: function() {
        var records = $scope.tableControl.getSelectedRecords();
        console.log('Submit ', records);
      },
      exportSelected: function() {
        var records = $scope.tableControl.getSelectedRecords();
        console.log('Export ', records);
      },
      deleteSelected: function() {
        var records = $scope.tableControl.getSelectedRecords();
        $scope.tableControl.deleteRecords(records);
        angular.forEach(records, function(rec) {
          rec.delete();
        });
      }
    }
  };


  Template:

  <div
      paginatedtable
      config="tableConfig"
      control="tableControl"
  ></div>


  * control: empty ({}) variable defined in the controller and extended in the
  directive (see Control: Properties and Control: Methods).

  ## Control: Properties

  * isLoading: (Boolean) True when records are being fetched.

  * records: (Array) Array of records that are used for populating the
  table.

  ## Control: Methods

  * clearFilterParams: Clears filters (aka api endpoint query params) that have been
  set, triggers a fetchTableRecords(true).

  * clearSelectedRecords: Clears selected/checked rows, used when rowSelect = true.

  * selectedRecords: Selected records for selected/checked rows, used when rowSelect = true.

  * deleteFilterParam: Delete a filter parameter.

  * deleteRecords(rec1, rec2,...): Delete records from table.

  * setFilterParam: Set a filter parameter to existing table filters.

  * setFilterParams: Set filters (aka api endpoint query params) when
  fetching table records from server, triggers a fetchTableRecords(true).

  ## Paginated Table Configuration

  config: {
    resource: <PaginatedResource>,
      - Required
      - Resource used for fetching table data.

    searching: true/false, default: true,
      - Adds search=<search str> to query parameters
      when fetching table data.
    search_location: 'left' or 'right',
    searchHelp: string (optional)
      - Add message under the search box
    
    hideLimits: boolean (optional default: false)

    limits: Array (optional)
      - Set optional limits for number of rows to display in table.

    rowSelect: true/false,
      - Adds column of checkboxes and 0 index so users
      can select table rows.

      - selectedRecords: function to get an array of
      selected records.

    disableTrackingTableState: boolean (optional default: false)
      - Disable tracking the state of the table (i.e. limit, ordering, etc)

    cols: [
      - Required
      - Define table columns

      {
          name: 'id',
            - Field name in the api endpoint
          display: 'Id',
            - Name to display in the column header
          sortable: true/false,
            - Sorts table ascending/descending when user
            clicks the tables <th>.  Adds ordering=[-]<name>
            to the query parameters.
          sort_by: ['data__first_name', 'data__last_name'],
            - Optional
            - Array of field names
            - If not set, using `name` property
          formatter: function(v) { return v; }
            - Optional
            - Function to modify column value
          hide: function() {}
            - Optional
            - Function to have a conditional column hide.
            - returns true/false
          tdTemplate: '<span>{{record.name}}</span>'
            - Optional
            - Will be used instead of col.name for value
            - Template defined in col settings
          tdTemplateUrl: 'common/directives/cell.tpl.html'
            - Optional
            - Will be used instead of col.name for value
            - Template url defined in col settings
      },
      ...
    ],
    toolbar: {
      - Optional
      - Adds tool template above table

      template: <template>,
        - required
      ...
      Can define any other functions/properties needed
      for toolbar functionality.
      ...
    }
  };

  ## Events

  * `paginatedtable:resourceready`: Triggered after the directive's `resource`
  scope argument has changed from it's initial value of null/undefined.

  * `paginatedtable:toggle-selected`: Triggers everytime a row checkbox gets toggled.

  * `paginatedtable:clear-selected`: Triggers everytime a row checkbox gets cleared.

 */

angular
  .module('mermaid.libs')
  .directive('paginatedtable', [
    '$q',
    '$window',
    '$location',
    '$timeout',
    function($q, $window, $location, $timeout) {
      'use strict';
      return {
        restrict: 'EA',
        scope: {
          resource: '=',
          config: '=',
          control: '='
        },
        templateUrl:
          'app/_mermaid_common/libs/directives/paginated-table.tpl.html',
        controller: function($scope) {
          var VAL_TYPE_STRING = 1;
          var VAL_TYPE_NUMBER = 2;
          var VAL_TYPE_BOOLEAN = 3;
          var VAL_TYPE_UNDEFINED = 4;
          var VAL_TYPE_NULL = 5;
          var VAL_TYPES = {
            string: VAL_TYPE_STRING,
            number: VAL_TYPE_NUMBER,
            boolean: VAL_TYPE_BOOLEAN,
            undefined: VAL_TYPE_UNDEFINED
          };
          var QUERY_PARAMETER_DELIMITER = ':::';
          var $ctrl = this;
          var parsedTableConfig;
          var fetch_timeout;
          var paginationUpdates;
          var disableTrackingTableState;
          var table_query_params;
          var tableSettings = {};
          var defaultLimits = [10, 50, 100];
          var watchers = [];
          var unWatchers = [];
          var updateOnRemoteSync;
          var tableId;
          var defaultSortByColumns;
          var recordIdKey;
          var selectedRecords = {};

          $scope.search = null;
          $scope.sortArgs = null;
          $scope.sortArrArgs = null;
          $scope.selected = {};
          $scope.control.isLoading = false;

          var getTableId = function() {
            return 'tbl-' + $scope.config.id;
          };

          var getVarType = function(v) {
            if (v === null) {
              return VAL_TYPE_NULL;
            }
            return VAL_TYPES[typeof v];
          };

          var castString = function(v) {
            if (v == null) {
              return v;
            }

            var val_type = parseInt(v.substr(v.length - 2, 1), 10);
            v = v.substr(0, v.length - 3).trim();
            switch (val_type) {
              case VAL_TYPE_NUMBER:
                return Number(v);
              case VAL_TYPE_BOOLEAN:
                return v === 'true';
              case VAL_TYPE_UNDEFINED:
                return undefined;
              case VAL_TYPE_NULL:
                return null;
              default:
                return v;
            }
          };

          var getDefaultPagination = function() {
            var pagination = {
              page: 1,
              hasPrev: false,
              hasNext: false,
              limit: $scope.limits[1],
              total: 0,
              count: 0,
              numPages: 0,
              range: {
                from: 0,
                to: 0
              }
            };
            pagination = _.extend(
              pagination,
              _.get($scope.config, 'pagination', {})
            );
            return _.merge(pagination, parsedTableConfig || {});
          };

          var buildQuery = function(params) {
            var qry = {};
            var search = params.search || '';

            qry.limit = params.limit;
            qry.page = params.page;

            qry.ordering = params.sortArrArgs.join(',');

            // Search
            if (search.length > 0) {
              var terms = search.split('');
              var search_str = terms.join('.*') + '.*';
              qry.search = search_str;
            }

            // Filter
            if (params.filters) {
              qry = angular.merge(qry, params.filters);
            }
            return qry;
          };

          var updatePagination = function(updates) {
            var p = angular.copy($scope.pagination);
            p.limit = updates.limit || p.limit;
            p.page = updates.page || p.page;
            p.hasPrev =
              updates.hasPrev !== undefined ? updates.hasPrev : p.hasPrev;
            p.hasNext =
              updates.hasNext !== undefined ? updates.hasNext : p.hasNext;
            p.total = updates.total !== undefined ? updates.total : p.total;
            p.count = updates.count !== undefined ? updates.count : p.count;

            p.numPages = Math.ceil(p.count / p.limit);
            p.range = {
              from: 0,
              to: 0
            };
            if (p.total > 0) {
              p.range.from = (p.page - 1) * p.limit + 1;
              p.range.to = p.range.from + p.count - 1;
            }
            $scope.pagination = p;
          };

          var getTableQueryParam = function() {
            var split_qry_params;
            var table_id = getTableId();
            var param = $location.search() || {};
            if (param[table_id]) {
              split_qry_params = param[table_id].split(
                QUERY_PARAMETER_DELIMITER
              );
              return _.reduce(
                split_qry_params,
                function(obj, v) {
                  var kv = v.split('=');
                  obj[kv[0].trim()] = castString(kv[1]);
                  return obj;
                },
                {}
              );
            }
            return {};
          };

          var setTableQueryParam = function(qry) {
            var serialized_qry = _.map(qry, function(v, k) {
              return k + '=' + v + '(' + getVarType(v) + ')';
            }).join(QUERY_PARAMETER_DELIMITER);

            var table_id = getTableId();
            var p = {};
            p[table_id] = serialized_qry;
            $location.search(p);
          };

          var findSortColumnName = function(column_sortby) {
            return _.filter(
              $scope.sortArrArgs,
              columnItem =>
                columnItem === column_sortby ||
                columnItem === `-${column_sortby}`
            );
          };

          var applyConfig = function(config) {
            disableTrackingTableState =
              config.disableTrackingTableState || false;
            tableId = config.id;
            recordIdKey = config.recordIdKey || 'id';
            $scope.hideRowStripes = config.hideRowStripes || false;
            updateOnRemoteSync = config.updateOnRemoteSync || true;
            $scope.columns = _.map(config.cols, function(col) {
              if (col.sort_by == null) {
                col.sort_by = [col.name];
              }
              if (!_.isArray(col.sort_by)) {
                col.sort_by = [col.sort_by];
              }
              return col;
            });

            $scope.searchLocation =
              config.searchLocation === 'left' ? 'pull-left' : 'pull-right';

            $scope.searchPlaceholder = config.searchPlaceholder || 'Search...';
            $scope.searchHelp = config.searchHelp || '';
            $scope.searchIcon = config.searchIcon || 'fa-search';
            $scope.searching = config.searching;
            $scope.rowSelect = config.rowSelect;
            $scope.toolbar = config.toolbar || {};
            $scope.limits = config.limits || defaultLimits;
            $scope.rowFormatter = config.rowFormatter || function() {};
            $scope.pagination = config.pagination || {};
            $scope.filters = config.filters || {};
            $scope.hideLimits = config.hideLimits || false;

            var localStorageItem = localStorage.getItem(tableId);
            if (localStorageItem) {
              parsedTableConfig = JSON.parse(localStorage.getItem(tableId));
            }

            defaultSortByColumns = (parsedTableConfig &&
              parsedTableConfig.columns) || [config.defaultSortByColumn];

            watchers = config.watchers || [];
            angular.forEach(watchers, function(fx) {
              unWatchers.push($scope.control.$watch(fx));
            });
          };

          $ctrl.init = function(config) {
            applyConfig(config);
            $scope.pagination = getDefaultPagination();
            if (disableTrackingTableState !== true) {
              // Update with query parameters if they exist
              table_query_params = getTableQueryParam();
              if (!_.isEmpty(table_query_params)) {
                tableSettings.limit = table_query_params.limit;
                if (table_query_params.ordering) {
                  tableSettings.column_name = table_query_params.ordering.split(
                    ','
                  );
                  if (table_query_params.ordering[0] === '-') {
                    tableSettings.asc = false;
                  } else {
                    tableSettings.asc = true;
                  }
                  tableSettings.columns = table_query_params.ordering.split(
                    ','
                  );
                }
                localStorage.setItem(tableId, JSON.stringify(tableSettings));
              }
            } else {
              table_query_params = {};
            }

            paginationUpdates = {
              limit: table_query_params.limit || $scope.pagination.limit,
              page: table_query_params.page || $scope.pagination.page
            };

            if (table_query_params.ordering) {
              $scope.sortArrArgs = table_query_params.ordering.split(',');
            } else if (defaultSortByColumns.length >= 0) {
              $scope.sortArrArgs = defaultSortByColumns;
            }
            updatePagination(paginationUpdates);
            $scope.search = table_query_params.search || null;
          };

          $scope.fetchTableRecords = function(reset) {
            if ($scope.resource == null) {
              return $q.resolve([]);
            }
            var qry = null;
            $scope.control.isLoading = true;

            if (reset === true) {
              $scope.pagination = getDefaultPagination();
            }
            qry = buildQuery({
              limit: $scope.pagination.limit,
              page: $scope.pagination.page,
              sortArgs: $scope.sortArgs,
              sortArrArgs: $scope.sortArrArgs,
              search: $scope.search,
              filters: $scope.filters
            });

            // Wrapping $resource because it doesn't come
            // with .then(...)
            var qry_promise = $scope.resource.query(qry);
            if (qry_promise.$promise) {
              qry_promise = qry_promise.$promise;
            }

            $scope.control.clearSelectedRecords();

            return qry_promise.then(function(data) {
              $scope.control.records = data.results;
              updatePagination({
                hasPrev: data.previous != null,
                hasNext: data.next != null,
                total: data.count,
                count: data.results.length
              });
              $scope.control.isLoading = false;
              if (disableTrackingTableState !== true) {
                // Need to remove regex from string
                if (qry.search) {
                  qry.search = qry.search.replace(/\.\*/g, '');
                }
                setTableQueryParam(qry);
              }

              if (reset === true) {
                $window.scrollTo(0, 0);
              }
              return data;
            });
          };

          $scope.checkAscColumn = function(column) {
            $scope.sortArrArgs = $scope.sortArrArgs || [];
            var foundColumn = findSortColumnName(column.sort_by[0]);
            return foundColumn.length > 0 && !foundColumn[0].startsWith('-');
          };

          $scope.checkDescColumn = function(column) {
            $scope.sortArrArgs = $scope.sortArrArgs || [];
            var foundColumn = findSortColumnName(column.sort_by[0]);
            return foundColumn.length > 0 && foundColumn[0].startsWith('-');
          };

          $scope.sortColumn = function(column) {
            var column_sort_by = column.sort_by[0];
            var foundColumnName = findSortColumnName(column_sort_by)[0];
            if (!column.sortable) {
              return;
            }

            $scope.sortArrArgs = $scope.sortArrArgs || [];

            if ($scope.sortArrArgs.includes(foundColumnName)) {
              if ($scope.sortArrArgs[0] === foundColumnName) {
                $scope.sortArrArgs = $scope.sortArrArgs.map(val => {
                  if (val === column_sort_by) {
                    return `-${val}`;
                  } else if (val.substr(1) === column_sort_by) {
                    return val.substr(1);
                  }
                  return val;
                });
              } else {
                var tempFilterArr = _.filter(
                  $scope.sortArrArgs,
                  column => column !== foundColumnName
                );
                tempFilterArr.unshift(column_sort_by);
                $scope.sortArrArgs = tempFilterArr;
              }
            } else {
              $scope.sortArrArgs.unshift(column_sort_by);
            }

            var pageLimit = null;
            if (parsedTableConfig) {
              pageLimit = parsedTableConfig.limit;
            }
            tableSettings.limit = pageLimit || $scope.limits[1];
            tableSettings.columns = $scope.sortArrArgs;
            if (disableTrackingTableState !== true) {
              localStorage.setItem(tableId, JSON.stringify(tableSettings));
            }

            $scope.fetchTableRecords(true);
          };

          $scope.removeSort = function(column) {
            var foundColumnName = findSortColumnName(column.sort_by[0])[0];
            var filterSortColumns = _.filter(
              $scope.sortArrArgs,
              column => column !== foundColumnName
            );

            $scope.sortArrArgs = filterSortColumns;
            tableSettings.columns = filterSortColumns;
            if (disableTrackingTableState !== true) {
              localStorage.setItem(tableId, JSON.stringify(tableSettings));
            }
            $scope.fetchTableRecords(true);
          };

          $scope.indexOfColumn = function(column) {
            var foundIndex = -1;
            var sortArr = $scope.sortArrArgs || [];
            for (var i = 0; i < sortArr.length; i++) {
              if (
                sortArr[i] === column.sort_by[0] ||
                sortArr[i] === `-${column.sort_by[0]}`
              ) {
                foundIndex = i + 1;
              }
            }
            return foundIndex;
          };

          $scope.searchTable = function() {
            $scope.fetchTableRecords(true);
          };

          $scope.toggleRow = function(record) {
            var isToggled;
            if (selectedRecords[record[recordIdKey]]) {
              delete selectedRecords[record[recordIdKey]];
              isToggled = false;
            } else {
              selectedRecords[record[recordIdKey]] = record;
              isToggled = true;
            }
            $scope.$emit('paginatedtable:toggle-selected', [
              {
                tableId: tableId,
                isToggled: isToggled,
                record: record
              }
            ]);
          };

          $scope.pageLimitChange = function(limit) {
            tableSettings.limit = limit;

            tableSettings.columns = parsedTableConfig && $scope.sortArrArgs;
            if (disableTrackingTableState !== true) {
              localStorage.setItem(tableId, JSON.stringify(tableSettings));
            }
            updatePagination({
              limit: limit,
              page: 1
            });

            $scope.fetchTableRecords();
          };

          // Control Methods

          $scope.control.setFilterParams = function(params, refresh) {
            refresh = refresh === false ? false : true;
            $scope.filters = angular.merge({}, params);
            if (refresh) {
              $scope.fetchTableRecords(true);
            }
          };

          $scope.control.deleteFilterParam = function(key, refresh) {
            if (_.has($scope.filters, key)) {
              delete $scope.filters[key];
              if (refresh) {
                $scope.fetchTableRecords(true);
              }
            }
          };

          $scope.control.setFilterParam = function(key, param, refresh) {
            refresh = refresh === false ? false : true;
            $scope.filters = $scope.filters || {};
            $scope.filters[key] = param;
            if (refresh) {
              $scope.fetchTableRecords(true);
            }
          };

          $scope.control.clearFilterParams = function(ignoreAttrs) {
            // ignoreAttrs == Array of keys to keep in filters

            if (ignoreAttrs == null) {
              $scope.filters = {};
            } else {
              $scope.filters = _.reduce(
                ignoreAttrs,
                function(o, key) {
                  if (ignoreAttrs.indexOf(key) > -1) {
                    o[key] = $scope.filters[key];
                  }
                  return o;
                },
                {}
              );
            }
            $scope.fetchTableRecords(true);
          };

          $scope.control.getSelectedRecords = function() {
            return _.values(selectedRecords);
          };

          $scope.control.clearSelectedRecords = function() {
            $scope.selected.rows = {};
            $scope.$emit('paginatedtable:clear-selected', [
              {
                tableId: tableId
              }
            ]);
          };

          $scope.control.deleteRecords = function(del_records) {
            var idx;
            del_records = arguments;

            if (del_records.length === 0) {
              return;
            }

            angular.forEach(del_records, function(rec) {
              idx = $scope.control.records.indexOf(rec);
              if (idx !== -1) {
                delete $scope.selected.rows[idx];
              }
            });

            $scope.control.clearSelectedRecords();

            updatePagination({
              page: 1
            });

            $scope.control.refresh();
          };

          $scope.control.refresh = function(reset) {
            reset = reset || false;
            $timeout.cancel(fetch_timeout);
            fetch_timeout = $timeout(function() {
              $scope.fetchTableRecords(reset);
            }, 100);
          };

          // WATCHES

          var un = $scope.$watch('resource', function(n) {
            if (n == null) {
              return;
            }
            $scope.$emit('paginatedtable:resourceready');
            $scope.fetchTableRecords().then(function() {
              if ($scope.resource.offlinetable != null) {
                $scope.$on('localdb:refreshall', function() {
                  if (updateOnRemoteSync === true) {
                    $scope.control.refresh();
                  }
                });
              }
            });
            un();
          });

          $ctrl.init($scope.config);
        }
      };
    }
  ])
  .directive('tablecell', [
    '$compile',
    '$templateRequest',
    '$q',
    function($compile, $templateRequest, $q) {
      'use strict';
      return {
        restrict: 'EA',
        scope: {
          record: '=',
          column: '=',
          index: '=',
          control: '='
        },
        template: '<span ng-bind-html="cellValue"></span>',
        link: function(scope, element) {
          var template;

          function updateCellValue() {
            var val = null;
            if (!scope.column.name) {
              val = '';
            } else {
              val = _.get(scope.record, scope.column.name);
            }
            scope.column.formatter =
              scope.column.formatter ||
              function(v) {
                return v;
              };
            $q.resolve(
              scope.column.formatter(val, scope.record, scope.index, element)
            ).then(function(v) {
              scope.cellValue = v;
            });
          }

          if (scope.column.tdTemplateUrl) {
            $templateRequest(scope.column.tdTemplateUrl).then(function(html) {
              template = angular.element(html);
              element.html(template);
              $compile(template)(scope);
            });
            return;
          } else if (scope.column.tdTemplate) {
            template = angular.element(scope.column.tdTemplate);
            element.html(template);
            $compile(template)(scope);
            return;
          }

          // initial cell value call
          updateCellValue();

          scope.$watch(
            'record',
            function(n, o) {
              if (n !== o) {
                updateCellValue();
              }
            },
            true
          );
        }
      };
    }
  ])
  .directive('rowformatter', [
    function() {
      'use strict';
      return {
        restrict: 'A',
        scope: {
          rowRecord: '=',
          rowformatter: '=?'
        },
        link: function(scope, element) {
          var fx = function() {
            if (scope.rowformatter) {
              scope.rowformatter(scope.rowRecord, element);
            }
          };
          fx();
          scope.$watch(
            'rowRecord',
            function(n, o) {
              if (n !== o) {
                fx();
              }
            },
            true
          );
        }
      };
    }
  ]);
