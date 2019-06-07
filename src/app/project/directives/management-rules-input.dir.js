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
        scope.rule = null;
        scope.partial_restrictions = null;
        var resetPartialRestrictions = function() {
          scope.partial_restrictions = false;
          _.each(partial_restriction_choices, function(key) {
            _.set(scope.management, key, null);
          });
        };

        scope.$watch('management.open_access', function(n) {
          if (n === true) {
            scope.management.no_take = null;
            resetPartialRestrictions();
          }
        });

        scope.$watch('management.no_take', function(n) {
          if (n === true) {
            scope.management.open_access = null;
            resetPartialRestrictions();
          }
        });

        scope.$watch('partial_restrictions', function(n) {
          if (n === true) {
            scope.management.open_access = null;
            scope.management.no_take = null;
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
