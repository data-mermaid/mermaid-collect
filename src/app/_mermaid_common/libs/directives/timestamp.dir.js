angular.module('mermaid.libs').directive('timestamp', [
  function() {
    'use strict';
    return {
      restrict: 'EA',
      scope: {
        tsDate: '=',
        tsTime: '='
      },
      template: "{{tsDate | date: 'yyyy-MM-dd'}} {{tsTime | date: 'HH:mm'}}"
    };
  }
]);
