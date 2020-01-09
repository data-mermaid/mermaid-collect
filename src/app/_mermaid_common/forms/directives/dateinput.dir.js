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
          var val;
          var $date_input = element;
          var dataDateFormat = scope.$parent.widgetFormat;
          var dataMask = $date_input.attr('data-mask') || null;
          var dataMaskPlaceholder = $date_input.attr('data-mask-placeholder');
          var modalEl =
            angular.element(document.querySelector('.modal')) || null;

          $date_input.datepicker({
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
            $date_input.mask(dataMask, {
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
                $date_input.datepicker('setDate', ngModel.$modelValue);
              }
            }
          );

          // Open datepicker when clicking calendar icon - $broadcast from GlobalCtrl
          scope.$on('openDatepicker', function(e, clickEvt) {
            var $target = clickEvt.target.prev();
            if ($target.get(0) === $date_input.get(0)) {
              $target.datepicker('show');
            }
          });
        }
      };
    }
  ])

  .directive('dateinput', [
    '$timeout',
    '$compile',
    '$rootScope',
    'utils',
    function($timeout, $compile, $rootScope, utils) {
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
          var validators = [];
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
            var validatorElement = element.find('input');
            validatorElement.attr('bsdatepicker', '');
            if (attrs.widgetValidators) {
              validators = attrs.widgetValidators.split(',');
              for (var i = 0; i < validators.length; i++) {
                var validator_params = validators[i].split('=');
                var key = validator_params[0];
                validatorElement.attr(key, validator_params.slice(1));
              }
            }
            $compile(validatorElement)(scope);
          });

          // Needs to be on $rootscope so isolated scopes also have access
          // Needs this check so that its only defined once if there are
          // multiple directives on page
          if (!angular.isDefined($rootScope.openDatepicker)) {
            $rootScope.openDatepicker = function(evt) {
              $rootScope.$broadcast('openDatepicker', evt);
            };
          }
        }
      };
    }
  ]);
