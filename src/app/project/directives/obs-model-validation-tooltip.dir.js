angular.module('app.project').directive('obsModelValidationTooltip', [
  '$filter',
  function($filter) {
    'use strict';
    return {
      restrict: 'EA',
      require: 'ngModel',
      scope: {
        ngModel: '=',
        formInput: '=?'
      },
      template: `<sup ng-cloak ng-if="modelCtrl.$invalid">
          <i class="fa fa-warning error-color"></i>
      </sup>`,
      link: function(scope, element, attrs, controller) {
        const $element = $(element);
        const $tdElem = $element.closest('td');
        scope.modelCtrl = controller;

        const getMessage = function() {
          const errors = $filter('validators')(scope.modelCtrl.$error);
          let list = '';
          _.each(errors, function(val, key) {
            const msg = scope.modelCtrl.validator_messages[key];
            list += `<li>${msg}</li>`;
          });
          return `<ul class="validation-popup">${list}</ul>`;
        };

        const setValid = function(isValid) {
          if (isValid === true) {
            $tdElem.removeClass('state-error');
          } else {
            $tdElem.addClass('state-error');
          }
        };

        scope.$watch(
          'ngModel',
          function() {
            setValid(scope.modelCtrl.$valid);
          },
          true
        );

        $element.on('mouseenter', function() {
          $(this)
            .popover({
              content: getMessage(),
              html: true,
              container: 'body',
              placement: 'auto',
              delay: {
                show: 250,
                hide: 0
              }
            })
            .popover('show');
        });

        $element.on('mouseleave', function() {
          const elem = $(this);
          if (elem.length > 0) {
            $(this).popover('destroy');
          }
        });

        scope.$on('$destroy', function() {
          const elem = $(element);
          if (elem.length > 0) {
            $(element).popover('destroy');
          }
        });
      }
    };
  }
]);
