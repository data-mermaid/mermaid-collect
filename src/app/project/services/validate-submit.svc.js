angular.module('app.project').service('ValidateSubmitService', [
  '$http',
  'APP_CONFIG',
  'utils',
  function($http, APP_CONFIG, utils) {
    'use strict';
    var VALIDATE_ACTION = 'validate';
    var SUBMIT_ACTION = 'submit';
    var URL_TMPL =
      APP_CONFIG.apiUrl + 'projects/{{project}}/collectrecords/{{action}}/';
    var OK_VALIDATION_STATUS = 'ok';
    var WARN_VALIDATION_STATUS = 'warning';
    var ERROR_VALIDATION_STATUS = 'error';
    var IGNORE_VALIDATION_STATUS = 'ignore';

    // List of known statuses from the API
    var SUBMISSION_STAGES = {
      5: 'saved',
      10: 'validating',
      15: 'validated',
      20: 'submitting',
      25: 'submitted',
      default: 'unknown'
    };

    var TRANSECT_STATUS_LABELS_CLASSES = {
      saved: {
        label: 'Saved',
        class: 'row__status-saved'
      },
      validatedWarning: {
        label: 'Warnings',
        class: 'row__status-warnings'
      },
      validatedError: {
        label: 'Errors',
        class: 'row__status-errors'
      },
      validatedValid: {
        label: 'Valid',
        class: 'row__status-valid'
      },
      default: {
        label: 'Error: Unknown Status',
        class: ''
      }
    };

    var sendAction = function(action, project, recordIds) {
      if (_.isArray(recordIds) === false) {
        recordIds = [recordIds];
      }
      var url = utils.template(URL_TMPL, {
        action: action,
        project: project
      });
      var data = {
        ids: recordIds
      };
      return $http.post(url, data);
    };

    var validate = function(project, recordIds) {
      return sendAction(VALIDATE_ACTION, project, recordIds);
    };

    var submit = function(project, recordIds) {
      return sendAction(SUBMIT_ACTION, project, recordIds);
    };

    var getIdentifierStatus = function(identifierValidations) {
      var outputStatus = OK_VALIDATION_STATUS;
      for (var key in identifierValidations) {
        var status = identifierValidations[key].status;
        if (status === WARN_VALIDATION_STATUS) {
          outputStatus = WARN_VALIDATION_STATUS;
        } else if (status === ERROR_VALIDATION_STATUS) {
          return ERROR_VALIDATION_STATUS;
        }
      }
      return outputStatus;
    };

    var submissionStage = function(stage) {
      return SUBMISSION_STAGES[stage] || SUBMISSION_STAGES.default;
    };

    // returns one of validatedWarnings, validatedErrors, validatedValid

    var getValidationStatus = function(validations) {
      var validationValue = validations.status;
      if (validationValue === ERROR_VALIDATION_STATUS) {
        return 'validatedError';
      } else if (validationValue === WARN_VALIDATION_STATUS) {
        return 'validatedWarning';
      } else if (validationValue === OK_VALIDATION_STATUS) {
        return 'validatedValid';
      }

      return 'default';
    };

    var getCombinedtransectStatus = function(record) {
      var validations = record.validations || {};
      if (validations.status) {
        return getValidationStatus(validations);
      } else if (
        submissionStage(record.stage) === 'saved' &&
        !validations.status
      ) {
        return 'saved';
      }
      return 'default';
    };

    var transectStatusLabel = function(record) {
      return (
        TRANSECT_STATUS_LABELS_CLASSES[getCombinedtransectStatus(record)]
          .label || TRANSECT_STATUS_LABELS_CLASSES.default.label
      );
    };

    var transectStatusCssClass = function(record) {
      return (
        TRANSECT_STATUS_LABELS_CLASSES[getCombinedtransectStatus(record)]
          .class || TRANSECT_STATUS_LABELS_CLASSES.default.class
      );
    };

    var formatIdentifierValidations = function(identifierValidations) {
      var output = [];
      for (var key in identifierValidations) {
        if (identifierValidations[key].status === OK_VALIDATION_STATUS) {
          continue;
        }
        output.push(identifierValidations[key].message);
      }
      return output.sort();
    };

    var formatValidations = function(record) {
      var validations = _.get(record, 'validations.results', {});
      var errors = [];
      var warnings = [];
      var keys = _.keys(validations).sort();

      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var arr;
        var formattedValidations;
        var identifierValidations = validations[key];
        var status = getIdentifierStatus(identifierValidations);
        if (key.startsWith('_')) {
          continue;
        }

        if (
          status === OK_VALIDATION_STATUS ||
          status === IGNORE_VALIDATION_STATUS
        ) {
          continue;
        } else if (status === WARN_VALIDATION_STATUS) {
          arr = warnings;
        } else if (status === ERROR_VALIDATION_STATUS) {
          arr = errors;
        }
        formattedValidations = formatIdentifierValidations(
          identifierValidations
        );
        arr.push({
          identifier: key,
          messages: formattedValidations
        });
      }
      return {
        errors: errors,
        warnings: warnings
      };
    };
    /**
     * Get a list of validations keys of a CollectRecord that has been validated.
     * example: validate_fish_count, validate_observation_density
     *
     * @param  {OfflineRecord} record
     * @param  {Array[]<Validation Statuses>} statusFilter (Optional) Array of validation statuses
     * to include.
     * <Validation Statuses>:
     *    - OK_VALIDATION_STATUS
     *    - WARN_VALIDATION_STATUS
     *    - ERROR_VALIDATION_STATUS
     *    - IGNORE_VALIDATION_STATUS
     */
    var getValidationKeys = function(record, statusFilter) {
      var validations = _.get(record, 'validations.results', {});
      return _.reduce(
        validations,
        function(o, val, identifier) {
          if (identifier.startsWith('_')) {
            return o;
          }

          if (statusFilter == null) {
            o[identifier] = _.keys(val);
          } else {
            var keys = [];
            for (var k in validations[identifier]) {
              if (
                validations[identifier].hasOwnProperty(k) === false ||
                statusFilter.indexOf(validations[identifier][k].status) === -1
              ) {
                continue;
              }
              keys.push(k);
            }
            o[identifier] = keys;
          }
          return o;
        },
        {}
      );
    };

    var setIgnore = function(identifier, record) {
      var identifierValidations =
        _.get(record, 'validations.results.' + identifier) ||
        _.set(record, 'validations.results.' + identifier, {});
      var keys = _.keys(identifierValidations) || [];
      _.each(keys, function(key) {
        if (
          _.has(record, 'validations.results.' + identifier + '.' + key) &&
          _.get(record, 'validations.results.' + identifier + '.' + key, {})
            .status === WARN_VALIDATION_STATUS
        ) {
          record.validations.results[identifier][
            key
          ].status = IGNORE_VALIDATION_STATUS;
        }
      });
    };

    return {
      OK_VALIDATION_STATUS: OK_VALIDATION_STATUS,
      WARN_VALIDATION_STATUS: WARN_VALIDATION_STATUS,
      ERROR_VALIDATION_STATUS: ERROR_VALIDATION_STATUS,
      IGNORE_VALIDATION_STATUS: IGNORE_VALIDATION_STATUS,
      formatValidations: formatValidations,
      getIdentifierStatus: getIdentifierStatus,
      getValidationKeys: getValidationKeys,
      transectStatusLabel: transectStatusLabel,
      transectStatusCssClass: transectStatusCssClass,
      setIgnore: setIgnore,
      submit: submit,
      validate: validate
    };
  }
]);
