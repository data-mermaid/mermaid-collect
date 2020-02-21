/* globals angular, console, Dexie */
/* jshint strict: true */

// App Config Options
// ------------------

// * tableName: Table name
// * offlineTablePrimaryKey: Primary key name, default: 'id'
// * offlineTableIndices: (see: https://github.com/dfahlander/Dexie.js/wiki/Version.stores())
// * offlineTableStructure: (see: https://github.com/dfahlander/Dexie.js/wiki/Table.mapToClass())

/*
 Table joins:

 options.joinDefn (string):

  '<table foreign key>' -> '<offline table name>.<related key>, field1, field2, ..., fieldN'
  
  field1, field2, ..., fieldN = Fields and values to copy across from related table.

  example:
  'data.sample_event.site -> mermaid-projectsites-8c213ce8-7973-47a5-9359-3a0ef12ed201.id, name'

 options.joinDefn (object):
  
  Below is joining to an array rather than to an another OfflineTable.  
  Join attributes are prefixed with $$.
  In the example below, to access joined fields/values you would do ...

    `<OfflineRecord Instance>.$$countries.name`

  {
    foreignKey: '<foreign key>',
    relatedRecords: Array of related records to join to,
    name: 'Join name, used as an attribute in the OfflineRecord to store join fields/values',
    relatedKey: '<key in related table to join to>',
    relateFunction: Function invoked per iteration it must return true (match) or false (no match).
    relatedColumns: Array of attributes to copy across from the related recods/table.
    many: (boolean) If result of the join is an Array of results or just one object. defaults: false
  }

  example 1:
  {
    foreignKey: 'country',
    relatedRecords: countries,
    name: 'countries',
    relatedKey: 'id',
    many: true,
    relateFunction: function(record, relatedRecord, joinSchema) {
      return record.val === 1;
    },
    relatedColumns: ['name']
  }

*/

// $watch Events
// -------------
// ot-createrecord
// ot-updaterecord
// ot-deleterecord
// ot-deleterecord-error

angular.module('mermaid.libs').service('OfflineTableEvents', [
  function() {
    'use strict';
    const listeners = {};

    const addListener = function(uniqueId, callback, context, keyName) {
      let _cb = callback;
      let _context = context;
      let _keyName = keyName;
      let isNew = true;

      if (keyName != null) {
        for (let i = 0; i < listeners.length; i++) {
          const entry = listeners[i];
          if (entry[2] === keyName) {
            _cb = entry[0];
            _context = entry[1];
            _keyName = entry[2];
            isNew = false;
            break;
          }
        }
      }

      if (isNew) {
        listeners[uniqueId] = listeners[uniqueId] || [];
        listeners[uniqueId].push([_cb, _context, _keyName]);
      }

      // an off function for cancelling the listener
      return function() {
        var i = listeners[uniqueId].findIndex(function(parts) {
          return (
            parts[0] === _cb && parts[1] === _context && parts[2] === _keyName
          );
        });
        if (i > -1) {
          listeners[uniqueId].splice(i, 1);
        }
      };
    };

    const clearListeners = function(uniqueId) {
      listeners[uniqueId] = [];
    };

    const notify = function(uniqueId, event, data) {
      if (_.isArray(listeners[uniqueId]) === false) {
        return;
      }

      angular.forEach(listeners[uniqueId].slice(), function(parts) {
        parts[0].call(parts[1], { event: event, data: data });
      });
    };

    return {
      addListener: addListener,
      clearListeners: clearListeners,
      notify: notify
    };
  }
]);

angular.module('mermaid.libs').factory('OfflineTable', [
  '$q',
  '$http',
  'ErrorService',
  'connectivity',
  'OfflineTableEvents',
  function($q, $http, ErrorService, connectivity, OfflineTableEvents) {
    'use strict';
    var DB_VERSION = 1;

    var generateUuid = function() {
      var d = new Date().getTime();
      if (window.performance && typeof window.performance.now === 'function') {
        d += performance.now(); //use high-precision timer if available
      }
      var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
        /[xy]/g,
        function(c) {
          var r = (d + Math.random() * 16) % 16 | 0;
          d = Math.floor(d / 16);
          return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
        }
      );
      return uuid;
    };

    var getDexieDB = function(name, autoOpen) {
      autoOpen = autoOpen == null ? true : autoOpen;
      return new Dexie(name, {
        autoOpen: autoOpen
      });
    };

    var parseJoinSchema = function(schema) {
      if (schema == null) {
        return {};
      }
      return _.reduce(
        schema,
        function(o, joinSchema, key) {
          if (_.isObject(joinSchema)) {
            if (
              (!!joinSchema.relatedTable && !joinSchema.relatedRecords) ||
              !joinSchema.foreignKey ||
              !joinSchema.relatedKey ||
              !joinSchema.relatedColumns
            ) {
              throw 'Invalid table join schema';
            }
            o[key] = joinSchema;
          } else {
            var schema_parts = joinSchema.split('->');
            if (schema_parts.length < 2) {
              console.error('Invalid table join schema');
              return null;
            }

            var related_parts = schema_parts[1].split(',');
            if (related_parts.length < 2) {
              console.error('Missing related table arguments.');
              return null;
            }

            var fk = schema_parts[0].trim();
            var related_key_parts = related_parts[0].split('.');
            var related_table = related_key_parts[0].trim();
            var related_key = related_key_parts[1].trim();
            var columns = _.map(related_parts.splice(1), function(v) {
              return v.trim();
            });

            o[key] = {
              foreignKey: fk,
              relatedTable: related_table,
              relatedKey: related_key,
              relatedColumns: columns
            };
          }

          return o;
        },
        {}
      );
    };

    return function(tableName, remote_url, options) {
      if (remote_url && !remote_url.endsWith('/')) {
        remote_url += '/';
      }

      function OfflineTable(tableName, remote_url, options) {
        options = options || {};

        var self = this;
        var schemaDefn = {};
        // var remoteTimestamp = options.remoteTimestamp || 'updated_on';
        var deleteExisting = options.deleteExisting || false;
        var tablePrimaryKey = options.offlineTablePrimaryKey || 'id';
        var tableIndices = options.offlineTableIndices || '';
        var tableStructure = options.offlineTableStructure || { id: String };

        var tableJoinSchema = parseJoinSchema(options.joinDefn || {});
        var deleteRecordAfterSync = options.deleteRecordAfterSync || false;

        // Ensure that primary key is included in indices.
        if (tableIndices.indexOf('&' + tablePrimaryKey) === -1) {
          var indices = '&' + tablePrimaryKey;
          if (tableIndices.trim().length > 0) {
            indices += ',' + tableIndices;
          }
          tableIndices = indices;
        }

        // Additional 'system' fields for keeping track
        // of record state.
        tableStructure.$$synced = Boolean;
        tableStructure.$$deleted = Boolean;

        if (deleteExisting) {
          Dexie.delete(tableName);
        }

        self.remote_url = remote_url;
        self.db = getDexieDB(tableName);

        // Database setup
        schemaDefn[tableName] = tableIndices;
        self.name = tableName;
        self.db.version(DB_VERSION).stores(schemaDefn);
        self.table = self.db[tableName];

        function _getResourceUrl(pk) {
          if (self.remote_url == null) {
            return null;
          }

          var url = self.remote_url;
          if (pk) {
            const url_parts = url.split('?');
            url = url_parts.shift() + pk + '/';
            if (url_parts.length > 1) {
              url += url_parts.join('?');
            }
          }
          return url;
        }

        function _getRemote(pk) {
          var url = _getResourceUrl(pk);
          return $http.get(url).catch(function(error) {
            ErrorService.errorHandler(error);
            throw error;
          });
        }

        function _addSystemFields(record, isSynced) {
          isSynced = isSynced || false;
          record.$$synced = isSynced;
          record.$$deleted = false;
          record.$$created = false;
          return record;
        }

        function _save(data, synced, deleted, localOnly) {
          localOnly = localOnly || false;
          synced = synced || false;
          deleted = deleted || false;
          if (localOnly !== true) {
            data.$$synced = synced;
            data.$$deleted = deleted;
          }
          return self.db.transaction('rw?', self.table, function() {
            return self.table.put(data).then(function() {
              return data;
            });
          });
        }

        function _delete(pk) {
          if (pk == null) {
            return $q.resolve();
          } else if (_.isArray(pk) === false) {
            pk = [pk];
          }
          return self.table
            .where(tablePrimaryKey)
            .anyOf(pk)
            .delete();
        }

        function canRemoteSync() {
          return connectivity.isOnline === true && self.remote_url != null;
        }

        function _remotePut(record) {
          if (canRemoteSync() === false) {
            return $q.resolve(record);
          }
          var pk = record[tablePrimaryKey];
          var url = _getResourceUrl(pk);
          var onSuccess = function() {
            return _save(record, true);
          };

          var onError = function(error) {
            if (error.status === 404) {
              // If record doesn't exist remotely delete it
              return _delete(pk);
            }
            return error;
          };
          // Strip 'system' properties
          var r_data = angular.fromJson(angular.toJson(record));
          return $http
            .put(url, r_data)
            .then(onSuccess, onError)
            .catch(function(error) {
              ErrorService.errorHandler(error);
              throw error;
            });
        }

        function _remoteDelete(record) {
          if (canRemoteSync() === false) {
            return $q.resolve(record);
          }
          var pk = record[tablePrimaryKey];
          var url = _getResourceUrl(pk);
          return $http
            .delete(url)
            .then(
              function() {
                return _delete(pk);
              },
              function(response) {
                if (response.status === 404 || response.status === 410) {
                  return _delete(pk);
                } else if (response.status >= 400) {
                  ErrorService.errorHandler(response);
                  record.$$deleted = false;
                  record.update(true);
                }
              }
            )
            .catch(function(error) {
              ErrorService.errorHandler(error);
              throw error;
            });
        }

        function _remotePost(record, refresh) {
          if (canRemoteSync() === false) {
            return $q.resolve(record);
          }
          var url = _getResourceUrl();
          var r_record = angular.fromJson(angular.toJson(record));
          return $http
            .post(url, r_record, {
              headers: { 'Content-Type': 'application/json' }
            })
            .then(function(remote_record) {
              if (refresh) {
                record = angular.merge(record, remote_record.data);
              }
              record.$$created = false;
              if (deleteRecordAfterSync) {
                return record.delete(true);
              } else {
                return _save(record, true);
              }
            })
            .catch(function(error) {
              ErrorService.errorHandler(error);
              throw error;
            });
        }

        function _remoteSync(action, record, refresh) {
          if (action === 'post') {
            return _remotePost(record, refresh);
          } else if (action === 'put') {
            return _remotePut(record);
          } else if (action === 'delete') {
            return _remoteDelete(record);
          }
          throw new Error(action + ' not supported');
        }

        self.$$notify = function(event, data) {
          OfflineTableEvents.notify(self.name, event, data);
        };

        self.$watch = function(cb, context, keyName) {
          return OfflineTableEvents.addListener(
            self.name,
            cb,
            context,
            keyName
          );
        };

        self.$clearListeners = function() {
          OfflineTableEvents.clearListeners(self.name);
        };

        self.getPrimaryKeyName = function() {
          return tablePrimaryKey;
        };

        self.getOptions = function() {
          return options;
        };

        self.setOptions = function(opts) {
          options = _.extend(options, opts);
        };

        self.setJoinDefn = function(joinSchema) {
          tableJoinSchema = parseJoinSchema(joinSchema);
        };

        self.getJoinDefn = function() {
          return tableJoinSchema;
        };

        var getTableByName = function(name, options) {
          return new OfflineTable(name, options);
        };

        var getRelatedTableRecords = function(relatedTableName, options) {
          return getTableByName(relatedTableName, options)
            .filter()
            .catch(function(err) {
              console.error(err);
              throw err;
            });
        };

        var join = function(name, records, relatedRecords, joinSchema) {
          var where = {};
          var tablePrefix = '$$' + name;
          var relatedColumns = joinSchema.relatedColumns;
          var foreignKey = joinSchema.foreignKey;
          var relatedKey = joinSchema.relatedKey;
          var many = joinSchema.many || false;

          where[relatedKey] = null;
          return _.map(records, function(obj) {
            obj[tablePrefix] = obj[tablePrefix] || {};

            if (_.isFunction(joinSchema.relateFunction)) {
              where = function(relatedRecord) {
                return joinSchema.relateFunction(
                  obj,
                  relatedRecord,
                  joinSchema
                );
              };
            } else {
              where[relatedKey] = _.get(obj, foreignKey);
            }

            var matches = _.filter(relatedRecords, where);

            obj[tablePrefix] = null;
            if (many === true) {
              obj[tablePrefix] = _.map(matches, function(match) {
                return _.assign({}, _.pick(match, relatedColumns));
              });
            } else {
              const match = matches.length > 0 ? matches[0] : {};
              obj[tablePrefix] = _.assign({}, _.pick(match, relatedColumns));
            }
            return obj;
          });
        };

        self.filter = function(qry_args, includeAll) {
          qry_args = qry_args || {};
          if (!includeAll) {
            qry_args.$$deleted = false;
          }

          return self.table.toArray(function(arr) {
            var joinPromises = [];
            if (tableJoinSchema) {
              _.each(tableJoinSchema, function(schema, key) {
                if (
                  schema.relatedRecords ||
                  _.isFunction(schema.relateFunction)
                ) {
                  joinPromises.push(
                    $q.resolve(join(key, arr, schema.relatedRecords, schema))
                  );
                } else {
                  joinPromises.push(
                    getRelatedTableRecords(schema.relatedTable).then(function(
                      relatedRecords
                    ) {
                      return join(key, arr, relatedRecords, schema);
                    })
                  );
                }
              });
            } else {
              joinPromises = [$q.resolve(arr)];
            }
            return $q.all(joinPromises).then(function() {
              return arr.filter(function(r) {
                for (var k in qry_args) {
                  var isFunction = _.isFunction(qry_args[k]);
                  if (isFunction && qry_args[k](_.get(r, k), r) === false) {
                    return false;
                  } else if (
                    !isFunction &&
                    _.has(r, k) &&
                    r[k] !== qry_args[k]
                  ) {
                    return false;
                  }
                }
                return true;
              });
            });
          });
        };

        self.count = function(qry, includeAll) {
          includeAll = includeAll || false;
          qry = qry || {};

          return self.filter(qry).then(function(recs) {
            return recs.length;
          });
        };

        self.get = function(pk) {
          if (pk == null) {
            return $q.resolve(null);
          }

          return self.table.get(pk, function(record) {
            if (record == null || record.$$deleted) {
              return null;
            }

            if (tableJoinSchema && record != null) {
              var joinPromises = [];
              _.each(tableJoinSchema, function(schema, key) {
                if (schema.relatedRecords) {
                  joinPromises.push(
                    $q.resolve(
                      join(key, [record], schema.relatedRecords, schema)
                    )
                  );
                } else {
                  joinPromises.push(
                    getRelatedTableRecords(schema.relatedTable).then(function(
                      relatedRecords
                    ) {
                      return join(key, [record], relatedRecords, schema);
                    })
                  );
                }
              });
              return $q.all(joinPromises).then(function() {
                return record;
              });
            }
            return $q.resolve(record);
          });
        };

        var _create = function(pk, record, synced) {
          var rec;
          synced = synced || false;

          // Prep new record
          record[tablePrimaryKey] = pk;
          rec = angular.merge({}, record);
          rec = _addSystemFields(rec);
          rec.$$created = true;
          return _save(rec);
        };

        self.create = function(record, localOnly) {
          localOnly = localOnly || false;
          var pk = record[tablePrimaryKey] || generateUuid();
          var createPromise = _create(pk, record);
          if (localOnly) {
            return createPromise.then(function(rec) {
              self.$$notify('ot-createrecord', [rec]);
            });
          }
          return createPromise
            .then(function(rec) {
              return _remoteSync(
                'post',
                angular.merge(new OfflineRecord(), rec),
                true
              ).then(function(resp) {
                self.$$notify('ot-createrecord', [rec]);
                return resp;
              });
            })
            .catch(function(err) {
              console.error('Create OfflineRecord:', err);
            });
        };

        // Add remote record directly to local database, creates
        // OfflineRecord but doesn't try to remotely sync.  If
        // record already exists locally the record is overwritten.
        // Example:
        //
        // var db = OfflineTable(APP_CONFIG.localDbName, 'https://test.com/records/');
        // $http.get(offlinedb.remote_url).then(function(resp) {
        //   angular.forEach(resp.data.results, function(rec) {
        //     db.addRemoteRecord(rec);
        //   });
        // });
        //

        self.addRemoteRecords = function(records) {
          if (!angular.isArray(records)) {
            records = [records];
          }

          if (records.length === 0) {
            return $q.resolve();
          }

          return self.db
            .transaction('rw?', self.table, function() {
              var promise;
              for (var i = 0; i < records.length; i++) {
                var record = records[i];
                var pk = record[tablePrimaryKey];
                if (pk == null) {
                  throw 'Primary key not defined';
                }
                records[i] = _addSystemFields(record, true);
              }
              promise = self.table.bulkPut(records);
              return promise.then(function(resp) {
                return resp;
              });
            })
            .then(function(response) {
              self.$$notify('ot-bulkupdate', []);
              return response;
            });
        };

        self.clear = function() {
          return self.table.clear();
        };

        self.isSynced = function() {
          return self.filter({ $$synced: false }, true).then(function(records) {
            return records.length === 0;
          });
        };

        self.deleteRecords = function(ids, localOnly) {
          localOnly = localOnly === true;
          if (localOnly) {
            return _delete(ids);
          }

          return $q.all(
            self.table
              .where(tablePrimaryKey)
              .anyOf(ids)
              .each(function(record) {
                return record.delete();
              })
          );
        };

        self.getResourceUrl = _getResourceUrl;

        /**************************************
         *                                     *
         *         OfflineRecord Class         *
         *                                     *
         **************************************/

        function OfflineRecord() {}

        OfflineRecord.prototype.remoteDelete = function() {
          return _remoteDelete(this);
        };

        OfflineRecord.prototype.remotePut = function() {
          return _remotePut(this);
        };

        OfflineRecord.prototype.remotePost = function() {
          return _remotePost(this);
        };

        OfflineRecord.prototype.remoteSync = function() {
          var action = 'put';
          if (this.$$deleted === true && this.$$synced === false) {
            action = 'delete';
          } else if (this.$$created === true && this.$$synced === false) {
            action = 'post';
          }
          return _remoteSync(action, this);
        };

        OfflineRecord.prototype.delete = function(localOnly) {
          var record = this;
          localOnly = localOnly || false;

          if (localOnly) {
            return _delete(record[tablePrimaryKey]).then(function() {
              self.$$notify('ot-deleterecord', []);
            });
          }
          return _save(record, false, true).then(function() {
            return record.remoteSync('delete', record).then(function(resp) {
              self.$$notify('ot-deleterecord', []);
              return resp;
            });
          });
        };

        OfflineRecord.prototype.update = function(localOnly) {
          var record = this;
          var pk = record[tablePrimaryKey];
          localOnly = localOnly || false;

          if (pk == null) {
            throw '`' + tablePrimaryKey + '` does not exist or not defined';
          }
          if (record.$$deleted === true) {
            throw 'Record does not exist';
          }

          var save_promise = _save(record, localOnly);
          if (localOnly) {
            return save_promise.then(function() {
              self.$$notify('ot-updaterecord', [record]);
              return record;
            });
          }

          return save_promise.then(function() {
            return record.remoteSync('put', record).then(function(resp) {
              self.$$notify('ot-updaterecord', [record]);
              return resp;
            });
          });
        };

        OfflineRecord.prototype.createNewInstance = function() {
          return self.get(this.id);
        };

        OfflineRecord.prototype.getTable = function() {
          return self;
        };

        OfflineRecord.prototype.clone = function() {
          var record = this;
          if (record.$$deleted === true) {
            throw 'Record does not exist';
          }

          var new_id = generateUuid();
          var new_record = _.cloneDeep(record);
          new_record.id = null;

          return _create(new_id, new_record, false).then(function(rec) {
            return _remoteSync(
              'post',
              angular.merge(new OfflineRecord(), rec),
              true
            ).then(function(resp) {
              self.$$notify('ot-createrecord', [rec]);
              return resp;
            });
          });
        };

        OfflineRecord.prototype.syncLocal = function() {
          var record = this;
          if (record.id == null) {
            console.warn(
              "Can't remotely update record because it doesn't exist"
            );
          }
          return _getRemote(record.id).then(
            function(resp) {
              var data = resp.data;

              if (data == null) {
                console.error("[%s] Can't refresh remote record", record.id);
              }
              record = angular.merge(record, data);
              return _save(record, true, false).then(function() {
                self.$$notify('ot-updaterecord', [record]);
                return record;
              });
            },
            function(error) {
              var status = error.status;

              if (status === 404) {
                // Re-create record remotely if it doesn't exist.
                return _remoteSync('post', record).then(function() {
                  return record;
                });
              }
              return null;
            }
          );
        }; /*******************/

        /*******************/ self.table.mapToClass(
          OfflineRecord,
          tableStructure
        );
      }

      return new OfflineTable(tableName, remote_url, options);
    };
  }
]);
