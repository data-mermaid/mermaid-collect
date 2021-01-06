/*
  REQUIRED:

  widget-form: Name of form widget is being used
  widget-name: <input> name
  ng-model: ng-model

  OPTIONAL:

  widget-label: label for input
  widget-help: Small help text added under input
  widget-if: ng-if
  widget-required: ng-required
  widget-placeholder: text placeholder
  widget-disabled: ng-disabled

  Example:

    <div timeinput
      widget-form="form"
      widget-name="test-time"
      widget-model="fishbelt.test_time"
      widget-label="Test Time"
      widget-if="true"
      widget-required="false"
      widget-disabled="false"
    ></div>

*/

angular
  .module('mermaid.forms')
  .directive('bsclockpicker', [
    function() {
      'use strict';
      return {
        restrict: 'A',
        require: 'ngModel',
        ngModel: '=',
        link: function(scope, element) {
          var $time_input = element;
          var modalEl =
            angular.element(document.querySelector('.modal')) || null;
          $time_input.clockpicker({
            donetext: 'Done',
            autoclose: true
          });
          $($time_input).on('focusin', function() {
            if (modalEl) {
              modalEl.addClass('active');
            }
          });
          $($time_input).on('focusout', function() {
            if (modalEl) {
              modalEl.removeClass('active');
            }
          });
        }
      };
    }
  ])

  .directive('timeinput', [
    'utils',
    function(utils) {
      'use strict';
      return {
        restrict: 'A',
        require: 'ngModel',
        transclude: {
          validations: '?validations'
        },
        scope: {
          ngModel: '=',
          widgetForm: '=',
          widgetRequired: '=?',
          widgetDisabled: '=?',
          widgetFormat: '@',
          widgetName: '@'
        },
        templateUrl: 'app/_mermaid_common/forms/directives/timeinput.tpl.html',
        link: function(scope, element, attrs, formCtrl) {
          if (attrs.widgetIf == null) {
            attrs.widgetIf = true;
          }
          scope.widgetLabel = attrs.widgetLabel;
          scope.widgetHelp = attrs.widgetHelp || '';
          scope.widgetPlaceholder = attrs.widgetPlaceholder || null;
          scope.widgetIf = utils.truthy(attrs.widgetIf);
          scope.widgetRequired = utils.truthy(scope.widgetRequired);
          scope.widgetDisabled = utils.truthy(scope.widgetDisabled);

          if (attrs.widgetIf == null) {
            scope.widgetIf = true;
          }

          scope.timeNavInput = function($event) {
            if ($event.keyCode === 8) {
              $(element)
                .find('input.form-control')
                .val(null);

              scope.ngModel.sample_time = null;
              formCtrl.$setDirty();
            }
          };

          scope.widgetIf = utils.truthy(scope.widgetIf);
        }
      };
    }
  ]);
