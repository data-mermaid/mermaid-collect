angular.module('app.project').directive('managementRulesInput', [
  function() {
    'use strict';
    return {
      restrict: 'E',
      require: '^form',
      scope: {
        management: '=',
        isDisabled: '='
      },
      templateUrl: 'app/project/directives/management-rules-input.tpl.html',
      link: function(scope, element, attrs, formCtrl) {
        scope.form = formCtrl;
        const partial_restriction_choices = [
          'periodic_closure',
          'size_limits',
          'gear_restriction',
          'species_restriction',
          'access_restriction'
        ];
        scope.partial_restrictions = false;

        const setRulesValidity = function() {
          const isValid =
            scope.management.open_access === true ||
            scope.management.no_take === true ||
            (scope.partial_restrictions === true &&
              (scope.management.periodic_closure === true ||
                scope.management.size_limits === true ||
                scope.management.gear_restriction === true ||
                scope.management.access_restriction === true ||
                scope.management.species_restriction === true));
          formCtrl.$setValidity('management_rules', isValid);
        };

        const resetPartialRestrictions = function() {
          scope.partial_restrictions = false;
          _.each(partial_restriction_choices, function(key) {
            _.set(scope.management, key, false);
          });
        };

        scope.$watch('management.open_access', function(n) {
          if (n === true) {
            scope.management.no_take = false;
            resetPartialRestrictions();
            setRulesValidity();
          }
        });

        scope.$watch('management.no_take', function(n) {
          if (n === true) {
            scope.management.open_access = false;
            resetPartialRestrictions();
            setRulesValidity();
          }
        });

        scope.$watch('partial_restrictions', function(n) {
          if (n === true) {
            scope.management.open_access = false;
            scope.management.no_take = false;
            setRulesValidity();
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
            setRulesValidity();
          }
        );

        setRulesValidity();
      }
    };
  }
]);
