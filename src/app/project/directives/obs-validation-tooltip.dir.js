angular.module('app.project').directive('obsValidationTooltip', [
  function() {
    'use strict';
    return {
      restrict: 'E',
      scope: {
        validations: '<?',
        validationsFx: '&?'
      },
      template: `<sup ng-cloak ng-if="modelCtrl.$invalid">
          <i class="fa fa-warning error-color"></i>
      </sup>`,
      link: function (scope, element, attrs, controller) {
        scope.isInvalid = false;
        scope.modelCtrl = controller;
        const $element = $(element);
        const validations =
          scope.validations != null ? scope.validations : scope.validationsFx();
        const failedValidations = _.filter(validations, function(v) {
          return v.isValid !== true;
        });
        let message = '';

        scope.isInvalid = failedValidations.length > 0;

        if (scope.isInvalid) {
          let list = '';
          _.each(failedValidations, function(validation) {
            if (validation.isValid !== true) {
              list += `<li>${validation.message}</li>`;
            }
          });
          message = `<ul class="validation-popup">${list}</ul>`;
        }

        $element.on('mouseenter', function() {
          $(this)
            .popover({
              content: message,
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
