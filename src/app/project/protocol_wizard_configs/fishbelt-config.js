angular.module('app.project').service('FishBeltWizardConfig', [
  '$stateParams',
  '$q',
  '$filter',
  'BaseWizardConfig',
  'OfflineTableUtils',
  'ValidateSubmitService',
  'TransectService',
  'ProjectService',
  function(
    $stateParams,
    $q,
    $filter,
    BaseWizardConfig,
    OfflineTableUtils,
    ValidateSubmitService,
    TransectService,
    ProjectService
  ) {
    'use strict';
    var service = _.extend({}, BaseWizardConfig);
    var projectId = $stateParams.project_id;

    service.len_surveyed = {
      templateUrl:
        'app/project/protocol_wizard_configs/partials/fishbelt-len_surveyed.tpl.html',
      ignoreButtonText: function(record) {
        var val = $filter('null_blank')(
          _.get(record.data, 'fishbelt_transect.len_surveyed', '')
        );
        return $q.resolve('Leave Transect length surveyed as ' + val);
      }
    };

    service.fishbelt_transect = {
      templateUrl:
        'app/project/protocol_wizard_configs/partials/fishbelt_transect.tpl.html',
      resolve: {
        sites: function() {
          return OfflineTables.ProjectSitesTable(projectId).then(function(
            table
          ) {
            return table.filter();
          });
        },
        relativedepths: function() {
          return ProjectService.fetchChoices().then(function(choices) {
            return choices.relativedepths;
          });
        },
        belttransectwidths: function() {
          return ProjectService.fetchChoices().then(function(choices) {
            return choices.belttransectwidths;
          });
        }
      }
    };

    service.obs_belt_fishes = {
      templateUrl:
        'app/project/protocol_wizard_configs/partials/obs_belt_fishes.tpl.html',
      ignoreOnly: true,
      resolve: {
        validationKeys: function(record) {
          var statusFilter = [ValidateSubmitService.WARN_VALIDATION_STATUS];
          var keys = ValidateSubmitService.getValidationKeys(
            record,
            statusFilter
          ).obs_belt_fishes;
          return $q.resolve(keys);
        },

        totalBiomass: function(record) {
          var total = ProjectService.fetchChoices().then(function(choices) {
            var width_key = _.get(record.data, 'fishbelt_transect.width');
            var width = _.find(choices.belttransectwidths, { id: width_key });
            if (angular.isDefined(width)) {
              return TransectService.calcTotalObsBiomass(
                record.data.obs_belt_fishes,
                _.get(record.data, 'fishbelt_transect.len_surveyed'),
                _.get(width, 'val')
              );
            }
          });
          return $q.resolve(total);
        }
      }
    };

    service.fish_attribute = {
      resolve: {
        displayName: 'Fish Attribute'
      }
    };

    service.width = {
      templateUrl:
        'app/project/protocol_wizard_configs/partials/width.tpl.html',
      ignoreButtonText: function(record) {
        var val = $filter('null_blank')(
          _.get(record.data, 'fishbelt_transect.width')
        );
        return $q.resolve('Leave Width as ' + val);
      },
      resolve: {
        belttransectwidths: function() {
          return ProjectService.fetchChoices().then(function(choices) {
            return choices.belttransectwidths;
          });
        }
      }
    };

    service.size_bin = {
      templateUrl:
        'app/project/protocol_wizard_configs/partials/size_bin.tpl.html',
      ignoreButtonText: function(record) {
        var val = $filter('null_blank')(
          _.get(record.data, 'fishbelt_transect.size_bin')
        );
        return $q.resolve('Leave Fish size bin as ' + val);
      },
      resolve: {
        fishsizebins: function() {
          return ProjectService.fetchChoices().then(function(choices) {
            return choices.fishsizebins;
          });
        }
      }
    };

    service.number = {
      templateUrl:
        'app/project/protocol_wizard_configs/partials/fishbelt-number.tpl.html',
      ignoreButtonText: function(record) {
        var val = $filter('null_blank')(
          _.get(record.data, 'fishbelt_transect.number')
        );
        return $q.resolve('Leave Transect Number as ' + val);
      }
    };

    return service;
  }
]);
