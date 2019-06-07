angular.module('mermaid.libs').directive('appinfo', [
  'AppMetaService',
  function(AppMetaService) {
    'use strict';
    return {
      restrict: 'AE',
      template:
        '<span class="txt-color-white">{{copyright}} MERMAID {{version}}</span>',
      link: function(scope) {
        var local_version = AppMetaService.local_version;
        if (local_version.startsWith('local')) {
          scope.version = AppMetaService.local_build;
        } else {
          scope.version = local_version;
        }
        scope.copyright = AppMetaService.copyright;
      }
    };
  }
]);
