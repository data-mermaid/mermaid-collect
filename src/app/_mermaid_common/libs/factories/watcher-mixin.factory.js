/*
  Using Mixin:

  // Use it in a controller
  angular.controller('DashboardCtrl', function DashboardController($scope, WatcherMixin, api) {
    angular.extend($scope, WatcherMixin);
  });

  Example triggering change in class/controller/directive/etc
    self.$$notify('ot-createrecord', [rec]);
*/

function WatcherMixin() {
  'use strict';

  var listeners = [];
  var $notify = function(event, data) {
    angular.forEach(listeners.slice(), function(parts) {
      parts[0].call(parts[1], { event: event, data: data });
    });
  };

  var $watch = function(cb, context) {
    listeners.push([cb, context]);

    // an off function for cancelling the listener
    return function() {
      var i = listeners.findIndex(function(parts) {
        return parts[0] === cb && parts[1] === context;
      });
      if (i > -1) {
        listeners.splice(i, 1);
      }
    };
  };

  return {
    $notify: $notify,
    $watch: $watch
  };
}

angular.module('mermaid.libs').factory('WatcherMixin', [
  function() {
    'use strict';
    return new WatcherMixin();
  }
]);
