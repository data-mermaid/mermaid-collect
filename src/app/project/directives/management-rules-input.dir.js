angular.module('app.project').directive('managementRulesInput', [
  function() {
    'use strict';
    return {
      restrict: 'E',
      scope: {
        management: '=',
        isDisabled: '='
      },
      templateUrl: 'app/project/directives/management-rules-input.tpl.html',
      link: function(scope) {
        var partial_restriction_choices = [
          'periodic_closure',
          'size_limits',
          'gear_restriction',
          'species_restriction'
        ];
        scope.partial_restrictions = false;
        var resetPartialRestrictions = function() {
          scope.partial_restrictions = false;
          _.each(partial_restriction_choices, function(key) {
            _.set(scope.management, key, false);
          });
        };

        scope.$watch('management.open_access', function(n) {
          if (n === true) {
            scope.management.no_take = false;
            resetPartialRestrictions();
          }
        });

        scope.$watch('management.no_take', function(n) {
          if (n === true) {
            scope.management.open_access = false;
            resetPartialRestrictions();
          }
        });

        scope.$watch('partial_restrictions', function(n) {
          if (n === true) {
            scope.management.open_access = false;
            scope.management.no_take = false;
          }
        });

        scope.$watch(
          function() {
            return _.map(partial_restriction_choices, function(val) {
              return _.get(scope.management, val) || '';
            }).join('-');
          },
          function(newVal) {
            if (newVal.indexOf('true') !== -1) {
              scope.partial_restrictions = true;
            }
          }
        );
      }
    };
  }
]);
