angular.module('app.project').directive('obsAttributeValidation', [
  function() {
    'use strict';
    return {
      restrict: 'EA',
      require: ['^form', 'ngModel'],
      scope: {
        ngModel: '=',
        widgetName: '=?',
        formInput: '=?'
      },
      templateUrl: 'app/project/directives/obs-attribute-validation.tpl.html',
      link: function(scope, element, attrs, controllers) {
        var $elem = $(element).closest('td');
        scope.dirty = false;
        scope.formCtrl = controllers[0];
        scope.modelCtrl = controllers[1];

        var setValid = function(is_valid) {
          if (is_valid === true) {
            $elem.removeClass('state-error');
          } else {
            $elem.addClass('state-error');
          }
        };

        scope.$watch(
          'ngModel',
          function(n, o) {
            if (o === n) {
              scope.dirty = false;
            } else {
              scope.dirty = true;
            }
            if (scope.dirty) {
              setValid(scope.modelCtrl.$valid);
            } else {
              setValid(true);
            }
          },
          true
        );
      }
    };
  }
]);
