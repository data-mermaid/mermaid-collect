angular.module('mermaid.libs').factory('StagedButtonGroup', [
  'StateButton',
  'ProjectService',

  function(StateButton, ProjectService) {
    'use strict';

    return function(options) {
      var saveButton = new StateButton({
        onlineOnly: false,
        icon: 'fa fa-save',
        classes: 'btn-success',
        name1: 'Save',
        name2: 'Saving',
        name3: 'Saved',
        class2: 'btn-primary',
        class3: 'btn-completed',
        enabled: true,

        click: function() {
          return StagedButtonGroup.prototype.save();
        }
      });

      var validateButton = new StateButton({
        onlineOnly: true,
        icon: 'fa fa-check',
        classes: 'btn-success',
        name1: 'Validate',
        name2: 'Validating',
        name3: 'Validated',
        class2: 'btn-primary',
        class3: 'btn-completed',
        click: function() {
          return StagedButtonGroup.prototype.validate();
        }
      });

      var submitButton = new StateButton({
        onlineOnly: true,
        icon: 'fa fa-upload',
        classes: 'btn-success',
        name1: 'Submit',
        name2: 'Submitted',

        click: function() {
          return StagedButtonGroup.prototype.submit();
        }
      });

      var StagedButtonGroup = function() {};

      StagedButtonGroup.prototype.setStage = function(stage) {
        switch (stage) {
          case ProjectService.SAVING_STAGE:
            saveButton.setState(2);
            submitButton.setState(1);

            saveButton.enabled = false;
            submitButton.enabled = false;
            break;
          case ProjectService.SAVED_STAGE:
            saveButton.setState(3);
            validateButton.setState(1);
            submitButton.setState(1);

            saveButton.enabled = false;
            validateButton.enabled = true;
            submitButton.enabled = false;
            break;
          case ProjectService.VALIDATING_STAGE:
            saveButton.setState(3);
            validateButton.setState(2);
            submitButton.setState(1);

            saveButton.enabled = false;
            validateButton.enabled = false;
            submitButton.enabled = false;
            break;
          case ProjectService.VALIDATED_STAGE:
            saveButton.setState(3);
            validateButton.setState(3);
            submitButton.setState(1);

            saveButton.enabled = false;
            validateButton.enabled = false;
            submitButton.enabled = true;
            break;
          case ProjectService.SUBMITTED_STAGE:
            saveButton.setState(2);
            validateButton.setState(3);
            submitButton.setState(2);

            saveButton.enabled = false;
            validateButton.enabled = false;
            submitButton.enabled = false;
            break;
          default:
            saveButton.setState(1);
            validateButton.setState(1);
            submitButton.setState(1);

            saveButton.enabled = true;
            validateButton.enabled = false;
            submitButton.enabled = false;
        }
      };

      StagedButtonGroup.prototype.save = null;
      StagedButtonGroup.prototype.validate = null;
      StagedButtonGroup.prototype.submit = null;

      StagedButtonGroup.prototype.setEnabled = function(isEnabled) {
        isEnabled = isEnabled || false;
        saveButton.enabled = isEnabled;
        validateButton.enabled = isEnabled;
        submitButton.enabled = isEnabled;
      };

      StagedButtonGroup.prototype.setVisible = function(isVisible) {
        isVisible = isVisible || false;
        saveButton.visible = isVisible;
        validateButton.visible = isVisible;
        submitButton.visible = isVisible;
      };

      StagedButtonGroup.prototype.getButtons = function() {
        return [saveButton, validateButton, submitButton];
      };

      return _.merge(StagedButtonGroup.prototype, options);
    };
  }
]);
