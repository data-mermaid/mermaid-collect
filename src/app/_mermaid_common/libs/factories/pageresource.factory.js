angular.module('mermaid.libs').factory('$pageresource', [
  'APP_CONFIG',
  '$resource',
  'ErrorService',
  function(APP_CONFIG, $resource, ErrorService) {
    'use strict';

    return function(url, params, methods) {
      var resourceUrl = APP_CONFIG.apiUrl + url;
      var errorInterceptor = {
        responseError: ErrorService.errorHandler
      };
      var defaults = {
        query: {
          method: 'GET',
          isArray: false,
          interceptor: errorInterceptor,
          transformResponse: function(data, headersGetter, status) {
            if (status < 500) {
              return angular.fromJson(data);
            }
            return data;
          }
        },
        get: {
          method: 'GET',
          isArray: false,
          interceptor: errorInterceptor,
          transformResponse: function(data, headersGetter, status) {
            if (status < 500) {
              data = angular.fromJson(data);
              data.$url = url + data.id;
            }
            return data;
          }
        },
        update: { method: 'PUT', interceptor: errorInterceptor },
        create: { method: 'POST', interceptor: errorInterceptor },
        remove: { method: 'DELETE', interceptor: errorInterceptor },
        delete: { method: 'DELETE', interceptor: errorInterceptor }
      };

      methods = angular.merge(defaults, methods);
      return $resource(resourceUrl, params, methods);
    };
  }
]);
