angular.module('app.project').controller('ProjectsCtrl', [
  '$rootScope',
  '$scope',
  '$state',
  'offlineservice',
  'PaginatedOfflineTableWrapper',
  'Button',
  'dataPolicies',
  'ConnectivityFactory',
  'connectivity',
  'ProjectsTable',
  function(
    $rootScope,
    $scope,
    $state,
    offlineservice,
    PaginatedOfflineTableWrapper,
    Button,
    dataPolicies,
    ConnectivityFactory,
    connectivity,
    ProjectsTable
  ) {
    'use strict';
    $scope.tableControl = {};

    const conn = new ConnectivityFactory($scope);
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
        'Fish Belt: <em>' +
        dataSharingPolicies[record.data_policy_beltfish] +
        '</em><br>' +
        'Benthics: <em>' +
        dataSharingPolicies[record.data_policy_benthiclit] +
        '</em><br>' +
        'Bleaching: <em>' +
        dataSharingPolicies[record.data_policy_bleachingqc] +
        '</em>'
      );
    };

    $scope.tableConfig = {
      id: 'projects',
      defaultSortByColumn: 'name',
      disableTrackingTableState: true,
      searching: true,
      searchPlaceholder: 'Filter projects by name or country',
      searchIcon: 'fa-filter',
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
          sortable: false,
          formatter: function(val) {
            if (_.isArray(val)) {
              return val.join(', ');
            }
            return '-';
          }
        },
        { name: 'num_sites', display: 'Number of Sites', sortable: false },
        {
          display: 'Data Sharing',
          sortable: false,
          formatter: function(val, record) {
            return dataSharingFormatter(record);
          }
        },
        {
          display: 'Offline Ready',
          sortable: false,
          tdTemplate:
            '<project-offline-toggle project-id="record.id"></project-offline-toggle>'
        }
      ]
    };

    $scope.resource = new PaginatedOfflineTableWrapper(ProjectsTable, {
      searchFields: ['name', 'countries']
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
        offlineservice.getOfflineProjects().then(function(results) {
          $scope.tableConfig.filters.id = function(projectId) {
            return results[projectId];
          };
          $scope.tableControl.refresh(true);
        });
      } else {
        delete $scope.tableConfig.filters.id;
        $scope.tableControl.refresh(true);
      }
    });
  }
]);
