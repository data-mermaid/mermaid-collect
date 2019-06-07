angular.module('mermaid.libs').directive('notAvailableOffline', [
  function() {
    'use strict';
    return {
      restrict: 'E',
      template:
        '<div offlineshow><div class="alert alert-warning">' +
        'Not available offline</div></div>'
    };
  }
]);
