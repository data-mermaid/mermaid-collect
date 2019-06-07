angular.module('mermaid.libs').directive('ignoreDirty', [
  'utils',
  function(utils) {
    'use strict';
    return {
      require: 'ngModel',
      link: function(scope, elm, attrs, ngModel) {
        var un = scope.$watch('ngModel', function() {
          un();
          var enabled = utils.truthy(attrs.ignoreDirty);
          if (enabled) {
            var oldSetValidity = ngModel.$setValidity;
            ngModel.$setPristine = function() {
              ngModel.$pristine = true;
            };
            ngModel.$setDirty = function() {
              ngModel.$dirty = false;
            };
            ngModel.$setValidity = function(validationErrorKey) {
              oldSetValidity(validationErrorKey, true);
            };
            ngModel.$pristine = true;
            ngModel.$dirty = false;
          }
        });
      }
    };
  }
]);
