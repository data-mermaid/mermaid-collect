angular.module('app.project').directive('observerList', [
  'utils',
  function(utils) {
    'use strict';
    return {
      restrict: 'EA',
      scope: {
        observers: '=',
        form: '=',
        projectProfiles: '=',
        isDisabled: '=?'
      },
      templateUrl: 'app/project/directives/observer-list.tpl.html',
      link: function(scope) {
        scope.observers_selected = {};
        scope.isDisabled = utils.truthy(scope.isDisabled);

        function updateObserverSelected() {
          _.each(scope.observers, function(o) {
            scope.observers_selected[o.profile] = true;
          });
        }

        function getObserver(observer_id) {
          var profiles = scope.projectProfiles;
          for (var i = 0; i < profiles.length; i++) {
            var o = profiles[i];
            if (o.id === observer_id) {
              return o;
            }
          }
          return null;
        }

        scope.removeObserver = function(observer) {
          if (scope.isDisabled) {
            return;
          }

          var index;
          scope.observers = scope.observers || [];
          index = scope.observers.indexOf(observer);
          if (index !== -1) {
            scope.observers.splice(index, 1);
            scope.form.$setDirty();
          }
          scope.observers_selected[observer.profile] = false;
        };

        scope.addObserver = function(observer_id) {
          if (scope.isDisabled) {
            return;
          }

          var observer = getObserver(observer_id);
          scope.observers = scope.observers || [];
          scope.observers.push(observer);
          scope.observers_selected[observer.profile] = true;
        };

        scope.$watch(
          'observers',
          function() {
            if (
              scope.form &&
              scope.form.$dirty &&
              (!scope.observers || scope.observers.length === 0)
            ) {
              scope.form.observers.$setValidity('$required', false);
            } else {
              scope.form.observers.$setValidity('$required', true);
            }
          },
          true
        );

        var un = scope.$watch(
          'observers',
          function(n) {
            if (n == null) {
              return;
            }
            updateObserverSelected();
            un();
          },
          true
        );
      }
    };
  }
]);
