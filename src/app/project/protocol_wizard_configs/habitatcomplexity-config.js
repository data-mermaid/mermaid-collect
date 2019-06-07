angular.module('app.project').service('HabitatComplexityWizardConfig', [
  '$q',
  '$filter',
  'BenthicBaseWizardConfig',
  'ValidateSubmitService',
  function($q, $filter, BenthicBaseWizardConfig, ValidateSubmitService) {
    'use strict';
    var service = _.extend({}, BenthicBaseWizardConfig);

    service.obs_habitat_complexities = {
      templateUrl:
        'app/project/protocol_wizard_configs/partials/obs_habitat_complexities.tpl.html',
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
          ).obs_habitat_complexities;
          return $q.resolve(keys);
        }
      }
    };

    service.interval_size = {
      templateUrl:
        'app/project/protocol_wizard_configs/partials/interval_size.tpl.html',
      ignoreButtonText: function(record) {
        var val = $filter('null_blank')(
          _.get(record.data, 'habitatcomplexity.interval_size')
        );
        return $q.resolve('Leave Interval size as ' + val);
      }
    };

    return service;
  }
]);
