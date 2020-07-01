angular.module('app.project').service('BenthicBaseWizardConfig', [
  '$q',
  '$filter',
  'BaseWizardConfig',
  function($q, $filter, BaseWizardConfig) {
    'use strict';
    var service = _.extend({}, BaseWizardConfig);

    service.depth = {
      templateUrl:
        'app/project/protocol_wizard_configs/partials/benthic-depth.tpl.html',
      ignoreButtonText: function(record) {
        var val = $filter('null_blank')(
          _.get(record.data, 'benthic_transect.depth')
        );
        return $q.resolve('Leave Depth as ' + val);
      }
    };

    service.benthic_transect = {
      templateUrl:
        'app/project/protocol_wizard_configs/partials/benthic_transect.tpl.html'
    };

    service.len_surveyed = {
      templateUrl:
        'app/project/protocol_wizard_configs/partials/benthic-len_surveyed.tpl.html',
      ignoreButtonText: function(record) {
        var val = $filter('null_blank')(
          _.get(record.data, 'benthic_transect.len_surveyed', '')
        );
        return $q.resolve('Leave Transect length surveyed as ' + val);
      }
    };

    service.number = {
      templateUrl:
        'app/project/protocol_wizard_configs/partials/benthic-number.tpl.html',
      ignoreButtonText: function(record) {
        var val = $filter('null_blank')(
          _.get(record.data, 'benthic_transect.number')
        );
        return $q.resolve('Leave Transect Number as ' + val);
      }
    };

    return service;
  }
]);
