angular
  .module('mermaid.libs')
  .directive('validationdetails', [
    'ValidationTemplateConfig',
    function(ValidationTemplateConfig) {
      'use strict';
      return {
        restrict: 'EA',
        scope: {
          formName: '@',
          record: '=',
          templatesConfig: '=?'
        },
        templateUrl:
          'app/_mermaid_common/libs/directives/validationdetails.tpl.html',
        link: function(scope) {
          scope.form = scope.$parent[scope.formName];
          scope.form_level_validations = {};
          scope.templatesConfig =
            scope.templatesConfig || ValidationTemplateConfig;
          scope.warning_count = 0;
          scope.error_count = 0;

          function processFieldValidation(field, results, validity_type) {
            scope.form[field].$validations[validity_type] =
              scope.form[field].$validations[validity_type] || {};
            _.each(results, function(result) {
              scope.form[field].$validations[validity_type][
                result.validation
              ] = result;
            });
          }

          function processFormValidation(field, results, validity_type) {
            scope.form_level_validations = scope.form_level_validations || {};
            scope.form_level_validations[validity_type] =
              scope.form_level_validations[validity_type] || [];
            _.each(results, function(result) {
              scope.form_level_validations[validity_type].push({
                field: field,
                message: field + ': ' + result.message,
                result: result
              });
            });
          }

          function processValidations(validations, field) {
            _.each(validations, function(validation) {
              validation.errors = validation.errors || [];
              validation.warnings = validation.warnings || [];

              scope.error_count += validation.errors.length;
              scope.warning_count += validation.warnings.length;

              // Flag error or warning at form input level
              if (validation.status === 0 || validation.status === 1) {
                scope.form[field] = scope.form[field] || {};
                scope.form[field].$validations =
                  scope.form[field].$validations || {};
                processFieldValidation(field, validation.warnings, 'warnings');
                processFieldValidation(field, validation.errors, 'errors');
              }
              processFormValidation(field, validation.warnings, 'warnings');
              processFormValidation(field, validation.errors, 'errors');
            });
          }

          function setValidations() {
            var validation =
              _.get(scope.record, 'data.submission_results.validation') || {};
            _.each(validation, processValidations);
          }

          function reset() {
            scope.form_level_validations = {};
            scope.warning_count = 0;
            scope.error_count = 0;
          }

          scope.clearValidations = function() {
            if (_.has(scope.record, 'data.submission_results')) {
              var validation =
                _.get(scope.record, 'data.submission_results.validation') || {};
              var fields = _.keys(validation);
              _.each(fields, function(field) {
                if (_.has(scope.form, field)) {
                  delete scope.form[field].$validations;
                }
              });
              delete scope.record.data.submission_results;
              reset();
              scope.form.$setDirty();
            }
          };

          scope.$watch('record', function(n) {
            if (n == null || n.id == null) {
              return;
            }
            setValidations();
          });
        }
      };
    }
  ])
  .directive('validationDisplay', [
    '$templateRequest',
    '$q',
    '$compile',
    function($templateRequest, $q, $compile) {
      'use strict';
      return {
        restrict: 'E',
        scope: {
          validationResult: '=',
          templateConfig: '=?'
        },
        link: function(scope, element) {
          var defaultTemplate = '<span>{{validationResult.message}}</span>';
          var updateDisplay = function() {
            var templatePromise;
            var config = scope.templateConfig || {};
            var templateUrl = config.url;
            if (templateUrl != null) {
              templatePromise = $templateRequest(templateUrl);
            } else {
              templatePromise = $q.resolve(defaultTemplate);
            }
            templatePromise.then(function(html) {
              var template = angular.element(html);
              element.html(template);
              $compile(template)(scope);
            });
          };

          scope.$watch(
            'template',
            function() {
              updateDisplay();
            },
            true
          );
        }
      };
    }
  ]);
