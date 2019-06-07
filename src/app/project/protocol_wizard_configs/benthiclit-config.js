angular.module('app.project').service('BenthicLITWizardConfig', [
  '$q',
  'BenthicBaseWizardConfig',
  'ValidateSubmitService',
  function($q, BenthicBaseWizardConfig, ValidateSubmitService) {
    'use strict';
    var service = _.extend({}, BenthicBaseWizardConfig);

    service.obs_benthic_lits = {
      templateUrl:
        'app/project/protocol_wizard_configs/partials/obs_benthic_lits.tpl.html',
      allowSkip: true,
      resolve: {
        validationKeys: function(record) {
          var statusFilter = [
            ValidateSubmitService.WARN_VALIDATION_STATUS,
            ValidateSubmitService.ERROR_VALIDATION_STATUS
          ];
          var keys = ValidateSubmitService.getValidationKeys(
            record,
            statusFilter
          ).obs_benthic_lits;
          return $q.resolve(keys);
        }
      }
    };

    return service;
  }
]);
