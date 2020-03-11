angular.module('app.project').service('BenthicPITWizardConfig', [
  '$stateParams',
  '$q',
  '$filter',
  'BenthicBaseWizardConfig',
  'ValidateSubmitService',
  function(
    $stateParams,
    $q,
    $filter,
    BenthicBaseWizardConfig,
    ValidateSubmitService
  ) {
    'use strict';
    var service = _.extend({}, BenthicBaseWizardConfig);

    service.obs_benthic_pits = {
      templateUrl:
        'app/project/protocol_wizard_configs/partials/obs_benthic_pits.tpl.html',
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
          ).obs_benthic_pits;
          return $q.resolve(keys);
        }
      }
    };

    service.interval_size = {
      templateUrl:
        'app/project/protocol_wizard_configs/partials/interval_size.tpl.html',
      ignoreButtonText: function(record) {
        var val = $filter('null_blank')(
          _.get(record.data, 'benthicpit.interval_size')
        );
        return $q.resolve('Leave Interval size as ' + val);
      }
    };

    service.interval_start = {
      templateUrl:
        'app/project/protocol_wizard_configs/partials/interval_start.tpl.html',
      ignoreButtonText: function(record) {
        var val = $filter('null_blank')(
          _.get(record.data, 'benthicpit.interval_start')
        );
        return $q.resolve('Leave Interval start as ' + val);
      }
    };

    return service;
  }
]);
