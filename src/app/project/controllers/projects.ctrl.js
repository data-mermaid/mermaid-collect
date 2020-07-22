angular.module('app.project').controller('ProjectsCtrl', [
  '$rootScope',
  '$scope',
  '$state',
  'OfflineTables',
  'PaginatedOfflineTableWrapper',
  'Button',
  'choices',
  'ConnectivityFactory',
  'connectivity',
  'ProjectService',
  function(
    $rootScope,
    $scope,
    $state,
    OfflineTables,
    PaginatedOfflineTableWrapper,
    Button,
    choices,
    ConnectivityFactory,
    connectivity,
    ProjectService
  ) {
    'use strict';
    $scope.tableControl = {};

    const conn = new ConnectivityFactory($scope);
    let refreshOnce = !connectivity.isOnline;
    const dataPolicies = choices.datapolicies;
    const dataSharingPolicies = dataPolicies
      ? _.reduce(
          dataPolicies,
          function(o, v) {
            o[v.id] = v.name;
            return o;
          },
          {}
        )
      : {};

    const dataSharingFormatter = function(record) {
      return (
        '<strong>Fish Belt:</strong> ' +
        dataSharingPolicies[record.data_policy_beltfish] +
        '</em><br>' +
        '<strong>Benthics:</strong> ' +
        dataSharingPolicies[record.data_policy_benthiclit] +
        '</em><br>' +
        '<strong>Bleaching:</strong> ' +
        dataSharingPolicies[record.data_policy_bleachingqc] +
        '</em>'
      );
    };

    $scope.tableConfig = {
      id: 'projects',
      defaultSortByColumn: 'name',
      disableTrackingTableState: false,
      searching: true,
      searchPlaceholder: 'Filter projects by name or country',
      searchLocation: 'right',
      filters: {
        include_fields: 'countries,num_sites'
      },
      cols: [
        {
          name: 'name',
          display: 'Name',
          sortable: true,
          tdTemplate:
            '<a ui-sref="app.project.records({project_id: record.id})">{{record.name}}</a>'
        },
        {
          name: 'countries',
          display: 'Countries',
          sortable: true,
          formatter: function(val) {
            if (_.isArray(val)) {
              return val.join(', ');
            }
            return '-';
          }
        },
        { name: 'num_sites', display: 'Number of Sites', sortable: true },
        {
          display: 'Offline Ready',
          sortable: false,
          tdTemplate:
            '<project-offline-toggle project-id="record.id"></project-offline-toggle>'
        },
        {
          display: 'Data Sharing',
          sortable: false,
          formatter: function(val, record) {
            return dataSharingFormatter(record);
          }
        },
        {
          display: 'Copy Project',
          sortable: false,
          tdTemplate:
            '<a ui-sref="fullapp.project({projectId: record.id})"><i class="fa fa-copy" /> Copy</a>'
        }
      ]
    };

    $scope.resource = null;
    OfflineTables.ProjectsTable().then(function(table) {
      $scope.resource = new PaginatedOfflineTableWrapper(table, {
        searchFields: ['name', 'countries']
      });
      $scope.tableConfig.isFiltering = !connectivity.isOnline;
      if (!connectivity.isOnline) {
        ProjectService.getOfflineProjects().then(function(results) {
          $scope.tableConfig.filters.id = function(projectId) {
            return results[projectId];
          };
          $scope.tableConfig.isFiltering = false;
        });
      }
    });

    const startProject = function() {
      $state.go('fullapp.project');
      startProjectButton.visible = false;
    };

    const startProjectButton = new Button();
    startProjectButton.name = 'Start Project';
    startProjectButton.enabled = true;
    startProjectButton.visible = connectivity.isOnline;
    startProjectButton.classes = 'btn-success';
    startProjectButton.onlineOnly = false;
    startProjectButton.click = startProject;

    $rootScope.PageHeaderButtons = [startProjectButton];

    conn.on('project-connectivity', function(event) {
      startProjectButton.visible = event.event === 'online';
      if (event.event === 'offline') {
        ProjectService.getOfflineProjects().then(function(results) {
          $scope.tableConfig.filters.id = function(projectId) {
            return results[projectId];
          };
          $scope.tableControl.refresh(true);
          $scope.tableConfig.isFiltering = false;
        });
        refreshOnce = true;
      } else if (event.event === 'online' && refreshOnce) {
        delete $scope.tableConfig.filters.id;
        $scope.tableControl.refresh(true);
        refreshOnce = false;
      }
    });
  }
]);
