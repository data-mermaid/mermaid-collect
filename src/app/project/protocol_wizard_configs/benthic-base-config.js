angular.module('app.project').service('BenthicBaseWizardConfig', [
  '$stateParams',
  '$q',
  '$filter',
  'BaseWizardConfig',
  'OfflineTables',
  'ProjectService',
  function(
    $stateParams,
    $q,
    $filter,
    BaseWizardConfig,
    OfflineTables,
    ProjectService
  ) {
    'use strict';
    var service = _.extend({}, BaseWizardConfig);
    var projectId = $stateParams.project_id;

    service.benthic_transect = {
      templateUrl:
        'app/project/protocol_wizard_configs/partials/benthic_transect.tpl.html',
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
        }
      }
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

    service.sample_time = {
      templateUrl:
        'app/project/protocol_wizard_configs/partials/sample_time.tpl.html',
      ignoreButtonText: function(record) {
        return $q.resolve(
          'Leave Sample Time as ' +
            _.get(record.data, 'benthic_transect.sample_time', '')
        );
      },
      resolve: {
        sampleUnit: function() {
          return $q.resolve('benthic_transect');
        }
      }
    };

    service.depth = {
      templateUrl:
        'app/project/protocol_wizard_configs/partials/depth.tpl.html',
      ignoreButtonText: function(record) {
        var val = $filter('null_blank')(
          _.get(record.data, 'benthic_transect.depth')
        );
        return $q.resolve('Leave Depth as ' + val);
      },
      resolve: {
        sampleUnit: function() {
          return $q.resolve('benthic_transect');
        }
      }
    };

    return service;
  }
]);
