angular.module('mermaid.libs').directive('saveAlert', [
  '$state',
  'utils',
  'layoutUtils',
  '$transitions',
  function($state, utils, layoutUtils, $transitions) {
    'use strict';
    return {
      restrict: 'EA',
      scope: {
        form: '='
      },
      link: function(scope) {
        var message =
          'This page contains changes that have not' +
          ' been saved. Do you wish to continue?';

        var cancelNav = function(event, fromState) {
          layoutUtils.activateNavItem(fromState);
          event.abort();
        };

        var acceptNav = function(
          removeEvent,
          toState,
          toStateParams,
          fromState
        ) {
          removeEvent();
          var selector = '<a data-ui-sref="' + fromState.name + '">';
          $(selector).remove('active');
          $state.go(toState, toStateParams);
        };

        scope.$on('onBeforeUnload', function(e, confirmation) {
          if (scope.form && scope.form.$dirty) {
            // https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onbeforeunload
            // actual dialog message not under control of page but returnValue should be set anyway
            confirmation.message = message;
            e.preventDefault();
          }
        });

        var newRouterChangeOff = $transitions.onStart({}, function(transition) {
          var toState = transition.to();
          var toStateParams = transition.params();
          var fromState = transition.from();
          if (!scope.form || !scope.form.$dirty) {
            return;
          }
          utils.showConfirmation(
            function() {
              acceptNav(newRouterChangeOff, toState, toStateParams, fromState);
            },
            'Warning',
            message,
            '',
            function() {
              cancelNav(transition, fromState);
            }
          );
          return false;
        });
      }
    };
  }
]);
