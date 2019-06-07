angular.module('mermaid.libs').service('RouterUtils', [
  '$state',
  '$transitions',
  function($state, $transitions) {
    'use strict';
    var service = {};

    service.fetchStates = function(state, states) {
      if (state && states.indexOf(state) == -1) {
        states.unshift(state);
      }

      var parentName = state.name.replace(/.?\w+$/, '');
      if (parentName) {
        return service.fetchStates($state.get(parentName), states);
      } else {
        return states;
      }
    };

    $transitions.onBefore({}, function(transition) {
      var toState = transition.to();
      var states = service.fetchStates(toState, []);
      var data = _.reduce(
        states,
        function(d, state) {
          d = _.extend(d, state.data);
          return d;
        },
        {}
      );
      toState.data = data;
    });

    return service;
  }
]);
