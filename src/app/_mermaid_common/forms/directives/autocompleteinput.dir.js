/*
  AutoComplete parameters

  Can add behaviour if widget-choices are being fetched asynchronously,
  See documentation at: https://angular-ui.github.io/bootstrap/

  Required:

  widget-form: Name of form widget is being used
  widget-name: <input> name
  ng-model: ng-model

  One of the following need to be defined:

  choices format: [{id: <>, name: <>}, ...];

  widget-choices: choices used for autocomplete options
  widget-lazy-choices: function to fetch resources (sync)
  widget-remote-choices: function to remotely fetch resources (async)

  Optional:

  widget-help: Small help text added under <select>
  widget-editable: t or f, false will only allow autocomplete options to be used. Default is false.
  widget-required: ng-required
  widget-disabled: ng-disabled
  widget-allow-invalid: ng-model-option
  widget-placeholder: text placeholder
  widget-callback: ie "onSelect()". Function definition/logic goes in the controller.

  ADD/EDIT Select choices:

  modal-title: title for modal window
  modal-controller: controller to use for model body
  modal-body-template-url: template to render in modal body
 */

angular.module('mermaid.forms').directive('autocompleteinput', [
  'utils',
  function(utils) {
    'use strict';
    return {
      restrict: 'EA',
      replace: true,
      require: 'ngModel',
      transclude: {
        validations: '?validations',
        appendaddon: '?appendaddon'
      },
      scope: {
        displayAttribute: '@',
        ngModel: '=',
        widgetForm: '=',
        widgetChoices: '=?',
        widgetLazyChoices: '=?',
        widgetRemoteChoices: '=?',
        widgetRequired: '=?',
        widgetDisabled: '=?',
        widgetEditable: '=?',
        widgetLimitTo: '=?',
        modalTitle: '=?',
        modalController: '=?',
        modalBodyTemplateUrl: '=?',
        widgetNewRecordModalConfig: '=?',
        widgetModalTrigger: '&',
        modalSaveCallback: '&',
        widgetCallback: '&',
        widgetType: '@',
        widgetName: '@',
        widgetNewRecordLabel: '@',
        widgetIgnoreDirty: '@'
        // dropUpEnabled: '=?'
      },
      templateUrl:
        'app/_mermaid_common/forms/directives/autocompleteinput.tpl.html',

      link: function(scope, element, attrs, ngModelCtrl, $transclude) {
        var choicesCache = null;
        scope.choices = function() {
          return [];
        };

        scope.widgetLabel = attrs.widgetLabel;
        scope.widgetName = attrs.widgetName;
        scope.widgetType = (scope.widgetType || 'text').toLowerCase();
        scope.widgetHelp = attrs.widgetHelp || '';
        scope.widgetAllowInvalid = attrs.widgetAllowInvalid || null;
        scope.widgetDisabled = utils.truthy(scope.widgetDisabled);
        scope.widgetRequired = utils.truthy(scope.widgetRequired);
        scope.widgetEditable = utils.truthy(scope.widgetEditable);
        scope.widgetIgnoreDirty = utils.truthy(scope.widgetIgnoreDirty);
        scope.dropUpEnabled = false;
        // scope.dropUpEnabled = utils.truthy(scope.dropUpEnabled) || false;
        scope.widgetPlaceholder = attrs.widgetPlaceholder;
        scope.displayAttribute = scope.displayAttribute || 'name';
        scope.moreThanThree = false;

        scope.transcludePresent = function(transclude) {
          return $transclude.isSlotFilled(transclude);
        };

        scope.formatValue = function($item, $model) {
          var selectedChoice = _.find(scope.widgetChoices, { id: $model });
          return selectedChoice
            ? selectedChoice[scope.displayAttribute]
            : $model;
        };

        var regexFilter = function(val, records) {
          if (val == null || val.length < 3) {
            return undefined;
          }

          var letters = val.split('');
          var regex_exp = new RegExp(letters.join('.*'), 'i');
          var matches = _.filter(records, function(record) {
            var label = record[scope.displayAttribute];
            if (label == null) {
              return false;
            }
            return label.match(regex_exp);
          });
          // This will output single families and genera
          // first because species names start with genus
          // EXCEPT if a family name actually comes after
          // the genus 'u'. If this happens we need to
          // have the API output taxonomic level and change
          // the function below to take account of it.
          return _.sortBy(matches, function(record) {
            return record[scope.displayAttribute];
          });
        };

        var updateDisplayValue = function() {
          var display = scope.formatValue(
            null,
            scope.ngModel[scope.widgetName]
          );
          $(element)
            .find('input.form-control')
            .val(display);
        };

        var preventTagNullDisplay = function(value) {
          if (_.isNull(value.tag)) {
            value.tag = undefined;
          }
        };

        var setupChoices = function() {
          if (
            scope.widgetLazyChoices &&
            _.isFunction(scope.widgetLazyChoices)
          ) {
            scope.widgetChoices = scope.widgetLazyChoices();
          }
          scope.choices = function(val) {
            if (val.length >= 3) {
              scope.moreThanThree = true;
            } else if (val.length < 3 || val === null) {
              scope.moreThanThree = false;
            }
            choicesCache = regexFilter(val, scope.widgetChoices);
            if (_.isUndefined(choicesCache)) {
              $(element)
                .find('input.form-control')
                .val(val);
            }
            return choicesCache;
          };
          choicesCache = scope.widgetChoices;
        };

        if (scope.widgetRemoteChoices) {
          scope.choices = function(search) {
            return scope.widgetRemoteChoices(encodeURIComponent(search));
          };
        } else {
          setupChoices();
          updateDisplayValue();
        }

        scope.$watch(
          'ngModel',
          function(v) {
            preventTagNullDisplay(v);
            updateDisplayValue();
          },
          true
        );
      }
    };
  }
]);
