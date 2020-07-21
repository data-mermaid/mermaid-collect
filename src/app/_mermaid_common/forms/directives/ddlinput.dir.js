/*
  DDL (aka <SELECT>) parameters

  REQUIRED:

  widget-form: Name of form widget is being used
  widget-name: <select> name
  ng-model: ng-model
  widget-mode: Either single, multiple, or group
  widget-choices: choices used for <option>

  OPTIONAL:

  widget-int-value: true/false
  widget-float-value: true/false
  widget-label: label for input
  widget-help: Small help text added under <select>
  widget-if: ng-if
  widget-required: ng-required
  widget-required-hide true/false
  widget-disabled: ng-disabled
  widget-include-blank: include a blank <option> (true, false, "")
  widget-change: ie "onChange()". function definition/logic goes in the controller.
  widget-choice-value:
      "id": uses choices[n].id
      "index": uses $index

  ADD/EDIT Select choices:

  modal-title: title for modal window
  modal-controller: controller to use for model body
  modal-body-template-url: template to render in modal body
 */
'use strict';
angular
  .module('mermaid.forms')
  .directive('ddlinput', [
    'utils',
    function(utils) {
      return {
        restrict: 'EA',
        replace: true,
        require: 'ngModel',
        transclude: {
          validations: '?validations',
          learnMoreButton: '?learnMoreButton'
        },
        scope: {
          displayAttribute: '@',
          ngModel: '=',
          widgetForm: '=',
          widgetChoices: '=',
          widgetRequired: '=?',
          widgetDisabled: '=?',
          widgetIncludeBlank: '=?',
          modalTitle: '=?',
          modalConfirmLabel: '=?',
          modalNextLabel: '=?',
          modalSection: '=?',
          modalSetSection: '=?',
          modalNumSections: '=?',
          modalController: '=?',
          modalBodyTemplateUrl: '=?',
          widgetChange: '&',
          widgetType: '@',
          widgetName: '@'
        },
        templateUrl: 'app/_mermaid_common/forms/directives/ddlinput.tpl.html',

        link: function(scope, element, attrs) {
          scope.hasLearnMore =
            element.find('.learn-more-button').children.length > 0;
          scope.mode = attrs.widgetMode || 'single';

          if (attrs.widgetDbChoices) {
            scope.widgetChoices = attrs.widgetName + '_choices';
          }

          scope.widgetMode = attrs.widgetMode || 'single';
          scope.widgetAppend = attrs.widgetAppend || null;
          scope.widgetPrepend = attrs.widgetPrepend || null;
          scope.widgetLabel = attrs.widgetLabel;
          scope.widgetHelp = attrs.widgetHelp || '';
          scope.widgetMinlength = attrs.widgetMinlength || null;
          scope.widgetMaxlength = attrs.widgetMaxlength || null;
          scope.widgetAllowInvalid = attrs.widgetAllowInvalid || null;
          scope.widgetPlaceholder = attrs.widgetPlaceholder || null;
          scope.widgetChoiceValue = attrs.widgetChoiceValue || 'id';
          scope.widgetRequired = utils.truthy(attrs.widgetRequired);
          scope.widgetRequiredHide = utils.truthy(attrs.widgetRequiredHide);
          scope.widgetDisabled = utils.truthy(scope.widgetDisabled);
          scope.widgetIntValue = utils.truthy(attrs.widgetIntValue);
          scope.widgetFloatValue = utils.truthy(attrs.widgetFloatValue);
          scope.widgetChange = scope.widgetChange || null;
          scope.displayAttribute = scope.displayAttribute || 'name';

          scope.widgetIncludeBlank = !scope.widgetRequired;
          if (attrs.widgetIncludeBlank) {
            // allow override
            scope.widgetIncludeBlank = utils.truthy(attrs.widgetIncludeBlank);
          }

          if (scope.widgetAppend !== null || scope.widgetPrepend !== null) {
            scope.checkSymbol = ' symbolinput';
          } else {
            scope.checkSymbol = '';
          }

          if (attrs.widgetIf == null) {
            scope.widgetIf = true;
          }
          scope.widgetIf = utils.truthy(scope.widgetIf);

          scope.choiceValue = function() {
            if (attrs.widgetChoiceValue === 'index') {
              return 'index';
            }
            return null;
          };

          scope.updateChoices = function(id, name) {
            var entry = { id: id, name: name };
            var index = _.findIndex(scope.widgetChoices, { id: id });
            if (index === -1) {
              if (Array.isArray(scope.widgetChoices)) {
                scope.widgetChoices.push(entry);
              } else {
                scope.widgetChoices[entry.id] = entry;
              }
              scope.ngModel[attrs.widgetName] = id;
            } else {
              scope.widgetChoices[index] = entry;
            }
          };
        }
      };
    }
  ])
  .directive('convertToInteger', [
    'utils',
    function(utils) {
      return {
        require: 'ngModel',
        link: function(scope, element, attrs, ngModel) {
          var enabled = utils.truthy(attrs.convertToInteger);

          if (enabled) {
            ngModel.$parsers.push(function(val) {
              return val != null ? parseInt(val, 10) : null;
            });
            ngModel.$formatters.push(function(val) {
              return val != null ? '' + val : null;
            });
          }
        }
      };
    }
  ])
  .directive('convertToFloat', [
    'utils',
    function(utils) {
      return {
        require: 'ngModel',
        link: function(scope, element, attrs, ngModel) {
          var enabled = utils.truthy(attrs.convertToFloat);

          if (enabled) {
            ngModel.$parsers.push(function(val) {
              return val != null ? parseFloat(val, 10) : null;
            });
            ngModel.$formatters.push(function(val) {
              return val != null ? '' + val : null;
            });
          }
        }
      };
    }
  ]);
