angular.module('app.project').service('BleachingWizardConfig', [
  '$stateParams',
  '$q',
  'BaseWizardConfig',
  'ValidateSubmitService',
  'OfflineTableUtils',
  'TransectService',
  function(
    $stateParams,
    $q,
    BaseWizardConfig,
    ValidateSubmitService,
    OfflineTableUtils,
    TransectService
  ) {
    'use strict';
    var service = _.extend({}, BaseWizardConfig);
    var projectId = $stateParams.project_id;

    service.quadrat_size = {
      templateUrl:
        'app/project/protocol_wizard_configs/partials/quadrat_size.tpl.html'
    };

    service.obs_colonies_bleached = {
      templateUrl:
        'app/project/protocol_wizard_configs/partials/obs_colonies_bleached.tpl.html',
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
          ).obs_colonies_bleached;
          return $q.resolve(keys);
        }
      }
    };

    service.obs_quadrat_benthic_percent = {
      templateUrl:
        'app/project/protocol_wizard_configs/partials/obs_quadrat_benthic_percent.tpl.html',
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
          ).obs_quadrat_benthic_percent;
          return $q.resolve(keys);
        }
      }
    };

    service.quadrat_collection = {
      templateUrl:
        'app/project/protocol_wizard_configs/partials/quadrat_collection.tpl.html',
      resolve: {
        sites: function() {
          return OfflineTables.ProjectSitesTable(projectId).then(function(
            table
          ) {
            return table.filter();
          });
        },
        projectProfiles: function() {
          return TransectService.getProjectProfileChoices(projectId);
        }
      }
    };

    return service;
  }
]);
