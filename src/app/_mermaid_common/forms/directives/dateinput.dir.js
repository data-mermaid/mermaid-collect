/*
  Date input parameters

  REQUIRED:

  widget-form: Name of form widget is being used
  widget-name: <input> name
  ng-model: ng-model

  OPTIONAL:

  widget-help: Small help text added under input
  widget-if: ng-if
  widget-required: ng-required
  widget-placeholder: text placeholder
  widget-format (see http://api.jqueryui.com/datepicker/#utility-parseDate)
  widget-mask: either set to a mask, or not included
  widget-disabled: ng-disabled

  Example:

  <div dateinput
      widget-form="form_block"
      widget-name="test"
      widget-model="block"
      widget-label="Test Date"
      widget-format="yy-dd-mm"
      widget-mask="99/99/9999"
  ></div>
*/

angular
  .module('mermaid.forms')
  .directive('bsdatepicker', [
    function() {
      'use strict';
      return {
        restrict: 'A',
        require: 'ngModel',
        scope: {
          ngModel: '='
        },

        link: function(scope, element, attr, ngModel) {
          let val;
          const $dateInput = $(element);
          const $dateInputIcon = $dateInput.parent().find('.input-group-addon');
          const dataDateFormat = scope.$parent.widgetFormat;
          const dataMask = $dateInput.attr('data-mask') || null;
          const dataMaskPlaceholder = $dateInput.attr('data-mask-placeholder');
          const modalEl =
            angular.element(document.querySelector('.modal')) || null;

          $dateInput.datepicker({
            keyboardNavigation: false,
            dateFormat: dataDateFormat,
            prevText: '<i class="fa fa-chevron-left"></i>',
            nextText: '<i class="fa fa-chevron-right"></i>',
            beforeShow: function() {
              if (modalEl) {
                modalEl.addClass('active');
              }
            },
            onClose: function() {
              if (modalEl) {
                modalEl.removeClass('active');
              }
            },
            onSelect: function(dateText, inst) {
              val =
                inst.selectedYear +
                '-' +
                (inst.selectedMonth + 1) +
                '-' +
                inst.selectedDay;
              scope.$apply(function() {
                ngModel.$setViewValue(val);
              });
            }
          });

          if (dataMask && dataMaskPlaceholder) {
            $dateInput.mask(dataMask, {
              placeholder: dataMaskPlaceholder
            });
          }

          scope.$watch(
            function() {
              return ngModel.$modelValue;
            },
            function(n, o) {
              if (n && n.length === 0) {
                n = null;
              }
              if (o && o.length === 0) {
                o = null;
              }

              if (n !== o && ngModel.$modelValue !== val) {
                $dateInput.datepicker('setDate', ngModel.$modelValue);
              }
            }
          );

          $dateInputIcon.click(function() {
            $dateInput.datepicker('show');
          });
        }
      };
    }
  ])

  .directive('dateinput', [
    '$timeout',
    '$compile',
    'utils',
    function($timeout, $compile, utils) {
      'use strict';
      return {
        restrict: 'EA',
        required: 'ngModel',
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
        templateUrl: 'app/_mermaid_common/forms/directives/dateinput.tpl.html',

        link: function(scope, element, attrs) {
          let validators = [];
          scope.widgetLabel = attrs.widgetLabel;
          scope.widgetHelp = attrs.widgetHelp || '';
          scope.widgetPlaceholder = attrs.widgetPlaceholder || null;
          scope.widgetMask = attrs.widgetMask || null;
          scope.widgetFormat = scope.widgetFormat || 'yy-mm-dd';
          scope.widgetDisabled = utils.truthy(scope.widgetDisabled);
          if (attrs.widgetIf == null) {
            scope.widgetIf = true;
          }
          scope.widgetIf = utils.truthy(scope.widgetIf);

          scope.hasMask = function() {
            if (attrs.widgetMask) {
              return 'yes';
            }
            return null;
          };

          $timeout(function() {
            const validatorElement = element.find('input');
            validatorElement.attr('bsdatepicker', '');
            if (attrs.widgetValidators) {
              validators = attrs.widgetValidators.split(',');
              for (let i = 0; i < validators.length; i++) {
                const validatorParams = validators[i].split('=');
                const key = validatorParams[0];
                validatorElement.attr(key, validatorParams.slice(1));
              }
            }
            $compile(validatorElement)(scope);
          });
        }
      };
    }
  ]);
