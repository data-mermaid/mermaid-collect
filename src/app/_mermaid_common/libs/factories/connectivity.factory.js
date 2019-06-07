angular.module('mermaid.libs').factory('ConnectivityFactory', [
  function() {
    'use strict';

    function ConnectivityFactory(scope) {
      let listeners = [];

      let notify = function(event, data) {
        _.each(listeners, function(entry) {
          entry.callback.call(entry.context, {
            event: event,
            data: data
          });
        });
      };

      this.on = function(identifier, cb, context) {
        if (identifier != null) {
          for (var i = 0; i < listeners.length; i++) {
            if (listeners[i].identifier == identifier) {
              return;
            }
          }
        }
        listeners.push({
          identifier: identifier,
          callback: cb,
          context: context
        });
      };

      this.off = function(identifier) {
        listeners = _.remove(listeners, function(o) {
          return o.identifier === identifier;
        });
      };

      scope.$on('online', function(event, isOnline) {
        if (isOnline === true) {
          notify('online');
        } else {
          notify('offline');
        }
      });
    }
    return ConnectivityFactory;
  }
]);
