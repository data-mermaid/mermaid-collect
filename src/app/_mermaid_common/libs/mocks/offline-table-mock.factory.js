angular.module('mermaid.libs.mocks').factory('OfflineTableMock', [
  '$q',
  function($q) {
    'use strict';

    return function(tableName, remote_url, options) {
      options = options || {};
      var self = this;
      var tablePrimaryKey = options.tablePrimaryKey || 'id';
      self.mockData = [];
      self.name = tableName;

      self.remote_url = remote_url;

      self.getPrimaryKeyName = function() {
        return tablePrimaryKey;
      };

      self.setMockData = function(mockData) {
        self.mockData = mockData;
        return self;
      };
      self.get = function(id) {
        var records = _.filter(self.mockData, { id: id });
        if (records.length === 0) {
          return $q.resolve(undefined);
        }
        return $q.resolve(records[0]);
      };
      self.getResourceUrl = function(pk) {
        if (self.remote_url == null) {
          return null;
        }

        var url = self.remote_url;
        if (pk) {
          url += pk + '/';
        }
        return url;
      };
      self.filter = function(qry) {
        return $q.resolve(_.filter(self.mockData, qry));
      };
    };
  }
]);
