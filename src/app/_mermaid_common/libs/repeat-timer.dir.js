angular
  .module('mermaid.libs')
  .service('TimerService', [
    function() {
      'use strict';

      return {
        startTime: {}
      };
    }
  ])
  .directive('repeatTimer', [
    '$timeout',
    'TimerService',
    function($timeout, TimerService) {
      'use strict';
      return function(scope, element, attrs) {
        if (scope.$last) {
          $timeout(function() {
            var end = new Date();
            console.log(
              '## DOM rendering list took [' +
                attrs.repeatTimer +
                ']: ' +
                (end - TimerService.startTime[attrs.repeatTimer]) +
                ' ms'
            );
          });
        } else if (scope.$first) {
          TimerService.startTime[attrs.repeatTimer] = new Date();
        }
      };
    }
  ]);
