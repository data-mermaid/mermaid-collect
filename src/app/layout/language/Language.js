'use strict';

angular.module('app').factory('Language', function($http, $log) {
  function getLanguage(key, callback) {
    $http
      .get('langs/' + key + '.json')
      .success(function(data) {
        callback(data);
      })
      .error(function() {
        $log.log('Error');
        callback([]);
      });
  }

  function getLanguages(callback) {
    $http
      .get('languages.json')
      .success(function(data) {
        callback(data);
      })
      .error(function() {
        $log.log('Error');
        callback([]);
      });
  }

  return {
    getLang: function(type, callback) {
      getLanguage(type, callback);
    },
    getLanguages: function(callback) {
      getLanguages(callback);
    }
  };
});
