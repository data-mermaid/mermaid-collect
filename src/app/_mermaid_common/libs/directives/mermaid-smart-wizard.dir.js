'use strict';

angular.module('mermaid.libs').directive('mermaidSmartWizard', function() {
  return {
    restrict: 'A',
    scope: {
      currentStep: '=?',
      smartWizardCallback: '&'
    },
    link: function(scope, element) {
      var stepsCount = $('[data-smart-wizard-tab]').length;

      scope.currentStep = scope.currentStep || 1;

      var validSteps = [];

      var $form = element.closest('form');

      var $prev = $('[data-smart-wizard-prev]', element);

      var $next = $('[data-smart-wizard-next]', element);

      function setStep(step) {
        scope.currentStep = step;
        $('[data-smart-wizard-pane=' + step + ']', element)
          .addClass('active')
          .siblings('[data-smart-wizard-pane]')
          .removeClass('active');
        $('[data-smart-wizard-tab=' + step + ']', element)
          .addClass('active')
          .siblings('[data-smart-wizard-tab]')
          .removeClass('active');

        $prev.toggleClass('disabled', step == 1);
      }

      element.on('click', '[data-smart-wizard-tab]', function(e) {
        setStep(parseInt($(this).data('smartWizardTab')));
        e.preventDefault();
      });

      $next.on('click', function(e) {
        if ($form.data('validator')) {
          if (!$form.valid()) {
            validSteps = _.without(validSteps, scope.currentStep);
            $form.data('validator').focusInvalid();
            return false;
          } else {
            validSteps = _.without(validSteps, scope.currentStep);
            validSteps.push(scope.currentStep);
            element
              .find('[data-smart-wizard-tab=' + scope.currentStep + ']')
              .addClass('complete')
              .find('.step')
              .html('<i class="fa fa-check"></i>');
          }
        }
        if (scope.currentStep < stepsCount) {
          setStep(scope.currentStep + 1);
        } else {
          if (validSteps.length < stepsCount) {
            var steps = _.range(1, stepsCount + 1);

            _(steps).forEach(function(num) {
              if (validSteps.indexOf(num) == -1) {
                setStep(num);
                return false;
              }
            });
          } else {
            var data = {};
            _.each($form.serializeArray(), function(field) {
              data[field.name] = field.value;
            });
            if (typeof scope.smartWizardCallback() === 'function') {
              scope.smartWizardCallback()(data);
            }
          }
        }

        e.preventDefault();
      });

      $prev.on('click', function(e) {
        if (!$prev.hasClass('disabled') && scope.currentStep > 0) {
          setStep(scope.currentStep - 1);
        }
        e.preventDefault();
      });

      setStep(scope.currentStep);

      scope.$watch('currentStep', function(newVal, oldVal) {
        if (newVal && newVal > 0 && newVal !== oldVal) {
          setStep(scope.currentStep);
        }
      });
    }
  };
});
