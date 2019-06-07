angular.module('app.project').controller('validationModalInstance', [
  '$uibModalInstance',
  'identifier',
  'record',
  'autoMoveNext',
  'wizardConfig',
  'update',
  'ignore',
  'ValidateSubmitService',
  function(
    $uibModalInstance,
    identifier,
    record,
    autoMoveNext,
    wizardConfig,
    update,
    ignore,
    ValidateSubmitService
  ) {
    'use strict';
    var $ctrl = this;
    var warningIcon = 'fa-warning';
    var errorIcon = 'fa-times-circle-o';

    $ctrl.identifier = identifier;
    $ctrl.record = record;
    $ctrl.autoMoveNext = autoMoveNext;
    $ctrl.identifiers = [];
    $ctrl.currentPage = 0;
    var defaultIgnoreButtonText = 'Leave value as is';

    var setIgnoreButtonLabel = function(text) {
      if (_.isFunction(text)) {
        text($ctrl.record).then(function(label) {
          $ctrl.ignoreButtonText = label;
        });
      } else if (_.isString(text)) {
        $ctrl.ignoreButtonText = text;
      } else {
        $ctrl.ignoreButtonText = defaultIgnoreButtonText;
      }
    };

    var setIcon = function(status) {
      if (status === ValidateSubmitService.ERROR_VALIDATION_STATUS) {
        $ctrl.icon = errorIcon;
      } else if (status === ValidateSubmitService.WARN_VALIDATION_STATUS) {
        $ctrl.icon = warningIcon;
      } else {
        $ctrl.icon = null;
      }
    };

    var getSortedIdentifiers = function(record, identifier) {
      var formattedValidations = ValidateSubmitService.formatValidations(
        record
      );
      var identifiers = _.map(formattedValidations.errors, 'identifier');
      identifiers = identifiers.concat(
        _.map(formattedValidations.warnings, 'identifier')
      );
      if (identifier) {
        identifiers = reorderByIdentifier(identifiers, identifier);
      }
      return identifiers;
    };

    var reorderByIdentifier = function(identifiers, identifier) {
      var idx = identifiers.indexOf(identifier);
      if (idx === -1 || idx === 0) {
        return identifiers;
      }

      var s = identifiers.slice(idx);
      var e = identifiers.slice(0, idx);
      return s.concat(e);
    };

    var loadPage = function(identifier) {
      var idx = $ctrl.identifiers.indexOf(identifier);

      // Load missing page
      if (idx === -1) {
        return;
      }

      var validations = _.get($ctrl.record, 'validations.results', {})[
        identifier
      ];
      $ctrl.identifier = identifier;
      $ctrl.validationStatus = ValidateSubmitService.getIdentifierStatus(
        validations
      );
      $ctrl.templateConfig =
        wizardConfig[identifier] || wizardConfig['default'];

      $ctrl.messages = _.map(validations, 'message').sort();
      setIcon($ctrl.validationStatus);
      setIgnoreButtonLabel(
        _.get(
          wizardConfig[identifier],
          'ignoreButtonText',
          defaultIgnoreButtonText
        )
      );
    };

    var nextPage = function() {
      if ($ctrl.identifiers.length === 0) {
        $ctrl.cancel();
      }
      if ($ctrl.currentPage === $ctrl.identifiers.length - 1) {
        $ctrl.currentPage = 0;
      } else {
        $ctrl.currentPage++;
      }
      loadPage($ctrl.identifiers[$ctrl.currentPage]);
    };

    var updateIdentifiers = function() {
      if ($ctrl.currentPage + 1 >= $ctrl.identifiers.length) {
        $ctrl.identifiers = [];
        return;
      }
      var nextIdentifier = $ctrl.identifiers[$ctrl.currentPage + 1];
      $ctrl.identifiers = getSortedIdentifiers($ctrl.record, nextIdentifier);
    };

    $ctrl.skipIssue = function() {
      if ($ctrl.identifiers.length === 1) {
        $ctrl.cancel();
      }
      nextPage();
    };

    $ctrl.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };

    $ctrl.updateIssue = function(identifier, record) {
      update(record).then(function(updatedRecord) {
        updatedRecord.createNewInstance().then(function(recordInstance) {
          $ctrl.record = recordInstance;
          updateIdentifiers();
          $ctrl.currentPage = -1;
          if ($ctrl.autoMoveNext === true) {
            nextPage();
          } else {
            $uibModalInstance.close();
          }
        });
      });
    };

    $ctrl.ignoreIssue = function(identifier, record) {
      ignore(identifier, record).then(function(updatedRecord) {
        updatedRecord.createNewInstance().then(function(recordInstance) {
          $ctrl.record = recordInstance;
          updateIdentifiers();
          $ctrl.currentPage = -1;
          if ($ctrl.autoMoveNext === true) {
            nextPage();
          } else {
            $uibModalInstance.close();
          }
        });
      });
    };

    $ctrl.identifiers = getSortedIdentifiers($ctrl.record, $ctrl.identifier);

    loadPage($ctrl.identifier);
  }
]);
