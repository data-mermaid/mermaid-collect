/*

  templateUrl: (string) path to template for wizard body content
  ignoreButtonText: (string/promise) Label for ignore button
  allowSkip: (boolean) Add skip button.
  resolve: (object) Object of resolvable methods that will be
  evaluate and be added to the scope of the template.
    example:
      ...
      resolve: {
        sites: function() {
          return $q.resolve(['a', 'b', 'c']);
        }
      },
      ...

      in template...
      <ul>
        <li ng-repeat="site in sites">{{site}}</li>
      </ul>

*/

angular.module('app.project').service('BaseWizardConfig', [
  '$stateParams',
  '$q',
  '$filter',
  'utils',
  'OfflineTables',
  'TransectService',
  function($stateParams, $q, $filter, utils, OfflineTables, TransectService) {
    'use strict';
    var service = {};
    var projectId = $stateParams.project_id;

    service.site = {
      templateUrl: 'app/project/protocol_wizard_configs/partials/site.tpl.html',
      ignoreButtonText: function(record) {
        return utils
          .getDisplayValue(
            _.get(record.data, 'sample_event.site'),
            'name',
            OfflineTables.ProjectSitesTable(projectId)
          )
          .then(function(val) {
            if (val !== null) {
              return 'Leave Site as ' + val;
            }
            return null;
          });
      },
      resolve: {
        sites: function() {
          return TransectService.getProjectSiteChoices(projectId);
        }
      }
    };

    service.management = {
      templateUrl:
        'app/project/protocol_wizard_configs/partials/management.tpl.html',
      ignoreButtonText: function(record) {
        return utils
          .getDisplayValue(
            _.get(record.data, 'sample_event.management'),
            'name',
            OfflineTables.ProjectManagementsTable(projectId)
          )
          .then(function(val) {
            return val
              ? 'Leave Management as ' + val
              : 'Leave Management as is';
          });
      },
      resolve: {
        managements: function() {
          return TransectService.getProjectManagementChoices(projectId);
        }
      }
    };

    service.sample_date = {
      templateUrl:
        'app/project/protocol_wizard_configs/partials/sample_date.tpl.html',
      ignoreButtonText: function(record) {
        return $q.resolve(
          'Leave Sample Date as ' +
            _.get(record.data, 'sample_event.sample_date', '')
        );
      }
    };

    service.sample_time = {
      templateUrl:
        'app/project/protocol_wizard_configs/partials/sample_time.tpl.html',
      ignoreButtonText: function(record) {
        return $q.resolve(
          'Leave Sample Time as ' +
            _.get(record.data, 'sample_event.sample_time', '')
        );
      }
    };

    service.depth = {
      templateUrl:
        'app/project/protocol_wizard_configs/partials/depth.tpl.html',
      ignoreButtonText: function(record) {
        var val = $filter('null_blank')(
          _.get(record.data, 'sample_event.depth')
        );
        return $q.resolve('Leave Depth as ' + val);
      }
    };

    service.observers = {
      templateUrl:
        'app/project/protocol_wizard_configs/partials/observers.tpl.html',
      resolve: {
        projectProfiles: function() {
          return OfflineTables.ProjectProfilesTable(projectId).then(function(
            table
          ) {
            return table.filter();
          });
        }
      }
    };

    service.default = {
      templateUrl:
        'app/project/protocol_wizard_configs/partials/default.tpl.html',
      readOnly: true,
      allowSkip: true
    };
    return service;
  }
]);
