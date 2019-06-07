angular.module('mermaid.libs').service('AppMetaService', [
  '$filter',
  'APP_CONFIG',
  function($filter, APP_CONFIG) {
    'use strict';
    var version = APP_CONFIG.releaseVersion || 'local';
    return {
      local_version: version.split('-')[0],
      local_build: APP_CONFIG.releaseVersion || '',
      copyright: '© ' + $filter('date')(new Date(), 'yyyy')
    };
  }
]);
