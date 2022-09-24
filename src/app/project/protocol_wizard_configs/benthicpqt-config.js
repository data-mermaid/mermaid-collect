angular.module('app.project').service('BenthicPQTWizardConfig', [
  '$q',
  'BenthicBaseWizardConfig',
  'ValidateSubmitService',
  'OfflineCommonTables',
  function(
    $q,
    BenthicBaseWizardConfig,
    ValidateSubmitService,
    OfflineCommonTables
  ) {
    'use strict';
    var service = _.extend({}, BenthicBaseWizardConfig);

    service.obs_benthic_lits = {
      templateUrl:
        'app/project/protocol_wizard_configs/partials/obs_benthic_photo_quadrats.tpl.html',
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
        },
        benthicAttributes: function() {
          return OfflineCommonTables.BenthicAttributesTable(true).then(function(
            table
          ) {
            return table.filter();
          });
        }
      }
    };

    return service;
  }
]);
