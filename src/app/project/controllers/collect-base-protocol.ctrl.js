/*

To inherit this controller:

Example:

...
var $ctrl = this;
$controller('CollectBaseProtocol', {$scope: $scope, $ctrl: $ctrl});
...
...
$ctrl.init();

*/

angular.module('app.project').controller('CollectBaseProtocol', [
  '$rootScope',
  '$scope',
  '$state',
  '$stateParams',
  '$q',
  'OfflineTables',
  'ProjectService',
  'CollectService',
  'ValidateSubmitService',
  'StagedButtonGroup',
  'utils',
  'logger',
  '$ctrl',
  function(
    $rootScope,
    $scope,
    $state,
    $stateParams,
    $q,
    OfflineTables,
    ProjectService,
    CollectService,
    ValidateSubmitService,
    StagedButtonGroup,
    utils,
    logger,
    $ctrl
  ) {
    'use strict';

    let submitPromise = null;

    // Iterates through a record to detect ignored warnings
    var detectIgnoredValidation = function(record) {
      var ignoredValidation = false;
      if (record && record.validations) {
        var validationKeys = Object.keys(record.validations.results);

        validationKeys.map(function(validationKey) {
          var objectKeys = Object.keys(
            record.validations.results[validationKey]
          );

          objectKeys.map(function(objectKey) {
            if (
              record.validations.results[validationKey][objectKey] &&
              record.validations.results[validationKey][objectKey].status ===
                'ignore'
            ) {
              ignoredValidation = true;
            }
          });
        });
      }
      return ignoredValidation;
    };

    $ctrl.defaultSchema = $ctrl.defaultSchema || {};
    $ctrl.projectId = $stateParams.project_id;
    $ctrl.recordId = $stateParams.id;
    $ctrl.protocol = null;
    $ctrl.state = null;

    $scope.choices = {};
    $scope.record = {};
    $scope.sampleUnit = {};
    $scope.isDisabled = true;
    $scope.hasValidated = false;
    $scope.isValid = false;
    $scope.ignoreWarningsPresent = false;
    $scope.protocolSampleUnitDetailsForm = null;
    $scope.protocolObservationsForm = null;
    $scope.wizardConfig = null;
    $scope.isOutdated = false;
    $scope.currentUser = $ctrl.currentUser;
    $scope.choices = $ctrl.transectLookups.choices;
    $scope.project_profiles = $ctrl.transectLookups.project_profiles;

    // Button setup
    $ctrl.stagedButtonGroup = new StagedButtonGroup();
    $ctrl.stagedButtonGroup.setEnabled(false);
    $ctrl.stagedButtonGroup.setVisible(false);
    $scope.isDisabled = ProjectService.isFormDisabled(
      $ctrl.projectProfile,
      ProjectService.COLLECTOR_ROLE
    );
    $ctrl.stagedButtonGroup.setVisible(
      $ctrl.projectProfile.is_collector || $ctrl.projectProfile.is_admin
    );

    // If new record apply schema to record
    if (!$ctrl.recordId || $ctrl.recordId.length === 0) {
      $scope.record = _.merge({}, $ctrl.defaultSchema, $ctrl.collectRecord);
      $scope.project = $ctrl.projectId;
      $scope.record.data = $scope.record.data || {};
      $scope.sampleUnit =
        $scope.record.data.benthic_transect ||
        $scope.record.data.quadrat_collection ||
        $scope.record.data.fishbelt_transect;
    } else {
      $scope.record = $ctrl.collectRecord;
      $scope.sampleUnit =
        $scope.record.data.benthic_transect ||
        $scope.record.data.quadrat_collection ||
        $scope.record.data.fishbelt_transect;
    }

    if ($scope.record && detectIgnoredValidation($scope.record)) {
      $scope.ignoreWarningsPresent = true;
    }

    var validations = $scope.record.validations || {};
    if (
      _.keys(validations.results).length > 0 &&
      $scope.record.stage == ProjectService.SAVED_STAGE
    ) {
      $scope.hasValidated = true;
    } else if (
      _.keys(validations.results).length > 0 &&
      $scope.record.stage == ProjectService.VALIDATED_STAGE
    ) {
      $scope.isValid = true;
    }

    $rootScope.PageHeaderButtons = $ctrl.stagedButtonGroup.getButtons();

    $ctrl.fetchRecord = function() {
      OfflineTables.CollectRecordsTable($ctrl.projectId)
        .then(function(table) {
          return table.get($ctrl.recordId);
        })
        .then(function(record) {
          if ($scope.form) {
            $scope.form.$setPristine();
          }
          const obsFieldNames = ProjectService.getObservationAttributeNames(
            record
          );
          if (obsFieldNames && obsFieldNames.length > 0) {
            for (let n = 0; n < obsFieldNames.length; n++) {
              utils.assignUniqueId(_.get(record, obsFieldNames[n]));
            }
          }
          $scope.record = record;
        })
        .finally(function() {
          if ($scope.record && detectIgnoredValidation($scope.record)) {
            $scope.ignoreWarningsPresent = true;
          }
        });
    };

    $ctrl.save = function() {
      var isDisabledState = $scope.isDisabled;
      $scope.record.stage = ProjectService.SAVING_STAGE;
      $scope.isDisabled = true;
      $scope.hasValidated = false;
      $scope.isValid = false;
      try {
        if (!$scope.record.id) {
          return createRecord().then(function() {
            $scope.record.stage = ProjectService.SAVED_STAGE;
            utils.showAlert('Success', 'Record Saved', utils.statuses.success);
          });
        }
        return updateRecord().then(function() {
          utils.showAlert('Success', 'Record Saved', utils.statuses.success);
        });
      } finally {
        $scope.isDisabled = isDisabledState;
      }
    };

    $scope.save = $ctrl.save;

    var createRecord = function() {
      var opts = {
        profileId: $scope.currentUser.id,
        projectId: $ctrl.projectId
      };
      $scope.record.data = $scope.record.data || {};
      $scope.record.data.protocol = $ctrl.protocol;
      $scope.record.project = $ctrl.projectId;

      return CollectService.save($scope.record, opts).then(function(result) {
        $scope.record = result.record;
        var params = {
          project_pk: $ctrl.projectId,
          id: $scope.record.id
        };
        $scope.form.$setPristine(true);
        $state.transitionTo($ctrl.state, params, {
          location: true,
          inherit: true,
          relative: $state.$current,
          notify: false
        });
      });
    };

    var updateRecord = function() {
      var resetStageValue = null;
      return CollectService.save($scope.record)
        .then(function() {
          resetStageValue = ProjectService.SAVED_STAGE;
          return $ctrl.fetchRecord();
        })
        .catch(function(err) {
          if (resetStageValue === ProjectService.SAVED_STAGE) {
            $scope.form.$setPristine(true);
            $state.reload();
          }
          return err;
        });
    };

    $ctrl.validate = function(reset) {
      var isDisabledState = $scope.isDisabled;

      if ($scope.form.$dirty || $scope.record.id == null) {
        utils.showAlert(
          'Warning',
          'Form must be saved.',
          utils.statuses.warning
        );
        $ctrl.stagedButtonGroup.setStage($scope.record.stage);
        return;
      }

      $ctrl.stagedButtonGroup.setStage(ProjectService.VALIDATING_STAGE);

      reset = reset || false;
      $scope.isDisabled = true;
      return CollectService.validate($scope.record, reset)
        .then(function(result) {
          if (
            result.record &&
            result.status === ValidateSubmitService.OK_VALIDATION_STATUS
          ) {
            $ctrl.stagedButtonGroup.setStage(ProjectService.VALIDATED_STAGE);
            $scope.isValid = true;
          } else {
            $ctrl.stagedButtonGroup.setStage($scope.record.stage);
          }
          return $ctrl.fetchRecord();
        })
        .finally(function() {
          $scope.isDisabled = isDisabledState;
          $scope.hasValidated = true;
        });
    };

    $ctrl.reset = function() {
      var validationKeys = Object.keys($scope.record.validations.results);

      validationKeys.map(function(validationKey) {
        var objectKeys = Object.keys(
          $scope.record.validations.results[validationKey]
        );

        objectKeys.map(function(objectKey) {
          if (
            $scope.record.validations.results[validationKey][objectKey] &&
            $scope.record.validations.results[validationKey][objectKey]
              .status === 'ignore'
          ) {
            $scope.record.validations.results[validationKey][objectKey].status =
              'warning';
          }
        });
      });

      $scope.record.update().then(function() {
        $ctrl.validate();
        $scope.ignoreWarningsPresent = false;
      });
    };

    $scope.reset = $ctrl.reset;

    $ctrl.submit = function() {
      if (
        $scope.form.$dirty ||
        $scope.record.id == null ||
        $scope.record.stage !== ProjectService.VALIDATED_STAGE
      ) {
        utils.showAlert(
          'Warning',
          'Form must be saved and validated.',
          utils.statuses.warning
        );
        return;
      }

      if (submitPromise !== null) {
        return submitPromise;
      }

      var isDisabledState = $scope.isDisabled;
      $scope.isDisabled = true;
      submitPromise = ValidateSubmitService.submit(
        $ctrl.projectId,
        $scope.record.id
      )
        .then(function(response) {
          var data = response.data;
          var result = data[$scope.record.id];
          if (
            result &&
            result.status === ValidateSubmitService.OK_VALIDATION_STATUS
          ) {
            return $scope.record.delete(true).then(function() {
              $state.go('app.project.records');
              return;
            });
          } else if (
            result &&
            result.status === ValidateSubmitService.WARN_VALIDATION_STATUS
          ) {
            utils.showAlert(
              'Warning',
              JSON.stringify(result.message, null, 2),
              utils.statuses.warning
            );
          } else if (
            result &&
            result.status === ValidateSubmitService.ERROR_VALIDATION_STATUS
          ) {
            utils.showAlert(
              'Error',
              JSON.stringify(result.message, null, 2),
              utils.statuses.error
            );
          }
        })
        .catch(function(err) {
          $scope.isDisabled = isDisabledState;
          logger.error('submit', err);
          return err;
        })
        .finally(function() {
          submitPromise = null;
        });

      return submitPromise;
    };

    $ctrl.init = function() {};

    $scope.saveValidate = function(record) {
      record.stage = ProjectService.SAVED_STAGE;
      if (!record.id) {
        utils.showAlert(
          'Warning',
          'Record must be saved.',
          utils.statuses.warning
        );
        return $q.resolve();
      }
      return CollectService.save(record)
        .then(function(result) {
          return result.record;
        })
        .then(function(savedRecord) {
          return CollectService.validate(savedRecord);
        })
        .then(function(result) {
          return result.record;
        });
    };

    $scope.ignoreSave = function(identifier, record) {
      $scope.ignoreWarningsPresent = true;

      return record
        .createNewInstance()
        .then(function(rec) {
          ValidateSubmitService.setIgnore(identifier, rec);
          return CollectService.save(rec);
        })
        .then(function(result) {
          var savedRecord = result.record;
          return CollectService.validate(savedRecord);
        })
        .then(function(result) {
          return result.record;
        });
    };

    $scope.modalClose = function() {
      return $ctrl.fetchRecord();
    };

    $ctrl.stagedButtonGroup.save = function() {
      $ctrl.save($scope.record);
    };
    $ctrl.stagedButtonGroup.validate = function(reset) {
      $ctrl.validate(reset);
    };
    $ctrl.stagedButtonGroup.submit = function() {
      $ctrl.submit();
    };

    // Ensure previous buttons are cleared
    $rootScope.PageHeaderButtons = $ctrl.stagedButtonGroup.getButtons();

    // *** WATCHES ***\

    $scope.$watchCollection(
      function() {
        return {
          stage: _.get($scope, 'record.stage'),
          isDirty: _.get($scope, 'form.$dirty')
        };
      },
      function(newVal, oldVal) {
        if (newVal.isDirty !== oldVal.isDirty && newVal.isDirty === true) {
          $scope.isValid = false;
          $scope.ignoreWarningsPresent = false;

          $ctrl.stagedButtonGroup.setStage(null);
          return;
        }
        $ctrl.stagedButtonGroup.setStage(newVal.stage);
      }
    );

    $scope.$watch(
      'record.validations',
      function(newVal) {
        if (newVal == null) {
          $scope.validations = {};
          return;
        }
        $scope.validations = ValidateSubmitService.formatValidations(
          $scope.record
        );
      },
      true
    );

    $scope.$watch('record.data.sample_event', function(newVal, oldVal) {
      // when new sample is created, set form dirty
      if (newVal !== oldVal) {
        $scope.form.$setDirty();
      }
    });

    var checkIfOutdatedValidation = function(updated_on, last_validated) {
      var updated_on_ts;
      var last_validated_ts;

      if (updated_on == null || last_validated == null) {
        $scope.isOutdated = false;
        return;
      }

      updated_on_ts = utils.toMomentTime(updated_on).valueOf();
      last_validated_ts = utils.toMomentTime(last_validated).valueOf();

      if (isNaN(updated_on_ts) || isNaN(last_validated_ts)) {
        $scope.isOutdated = false;
        return;
      }

      $scope.isOutdated = updated_on_ts > last_validated_ts;
    };

    $scope.$watchGroup(
      ['record.updated_on', 'record.validations.last_validated'],
      function(vals) {
        checkIfOutdatedValidation(vals[0], vals[1]);
      }
    );
  }
]);
