angular.module('app.project').service('BenthicPQTWizardConfig', [
  '$q',
  '$filter',
  'BenthicBaseWizardConfig',
  'ValidateSubmitService',
  'OfflineCommonTables',
  function(
    $q,
    $filter,
    BenthicBaseWizardConfig,
    ValidateSubmitService,
    OfflineCommonTables
  ) {
    'use strict';
    var service = _.extend({}, BenthicBaseWizardConfig);

    service.obs_benthic_photo_quadrats = {
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
          ).obs_benthic_photo_quadrats;
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

    service.quadrat_number_start = {
      templateUrl:
        'app/project/protocol_wizard_configs/partials/quadrat_number_start.tpl.html',
      ignoreButtonText: function(record) {
        var val = $filter('null_blank')(
          _.get(record.data, 'quadrat_transect.quadrat_number_start')
        );
        return $q.resolve('Leave Quadrat number start as ' + val);
      }
    };

    service.quadrat_size = {
      templateUrl:
        'app/project/protocol_wizard_configs/partials/qt_quadrat_size.tpl.html',
      ignoreButtonText: function(record) {
        var val = $filter('null_blank')(
          _.get(record.data, 'quadrat_transect.quadrat_size')
        );
        return $q.resolve('Leave Quadrat size as ' + val);
      }
    };

    service.num_quadrats = {
      templateUrl:
        'app/project/protocol_wizard_configs/partials/num_quadrats.tpl.html',
      ignoreButtonText: function(record) {
        var val = $filter('null_blank')(
          _.get(record.data, 'quadrat_transect.num_quadrats')
        );
        return $q.resolve('Leave Number of quadrats as ' + val);
      }
    };

    service.num_points_per_quadrat = {
      templateUrl:
        'app/project/protocol_wizard_configs/partials/num_points_per_quadrat.tpl.html',
      ignoreButtonText: function(record) {
        var val = $filter('null_blank')(
          _.get(record.data, 'quadrat_transect.num_points_per_quadrat')
        );
        return $q.resolve('Leave Number of points per quadrat as ' + val);
      }
    };

    return service;
  }
]);
