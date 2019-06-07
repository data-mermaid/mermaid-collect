angular.module('app.project').controller('ProjectsCtrl', [
  '$rootScope',
  '$scope',
  '$q',
  '$state',
  'offlineservice',
  'PaginatedOfflineTableWrapper',
  'Button',
  'Project',
  'localStorageService',
  'currentUser',
  'ConnectivityFactory',
  'connectivity',
  function(
    $rootScope,
    $scope,
    $q,
    $state,
    offlineservice,
    PaginatedOfflineTableWrapper,
    Button,
    Project,
    localStorageService,
    currentUser,
    ConnectivityFactory,
    connectivity
  ) {
    'use strict';
    $scope.tableControl = {};

    var user;
    var conn = new ConnectivityFactory($scope);

    var setTableResource = function() {
      var promise;
      if (connectivity.isOnline) {
        $scope.resource = Project;
        promise = $q.resolve();
      } else {
        promise = offlineservice
          .ProjectsTable(null, true)
          .then(function(table) {
            $scope.resource = new PaginatedOfflineTableWrapper(table, {
              searchFields: ['name', 'countries']
            });
          });
      }
      promise.then(function() {
        if ($scope.tableControl && $scope.tableControl.refresh) {
          $scope.tableControl.refresh();
        }
      });
    };

    $scope.resource = undefined;
    var tableConfig = {
      id: 'projects',
      defaultSortByColumn: 'name',
      searching: true,
      searchPlaceholder: 'Filter projects by name or country',
      searchIcon: 'fa-filter',
      searchLocation: 'right',
      filters: {
        include_fields: 'countries,num_sites',
        profile: currentUser.id
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
          display: 'Offline Ready',
          sortable: false,
          tdTemplate:
            '<project-offline-toggle project-id="record.id"></project-offline-toggle>'
        }
      ]
    };

    var startProject = function() {
      $state.go('fullapp.project');
      startProjectButton.visible = false;
    };

    var startProjectButton = new Button();
    startProjectButton.name = 'Start Project';
    startProjectButton.enabled = true;
    startProjectButton.visible = connectivity.isOnline;
    startProjectButton.classes = 'btn-success';
    startProjectButton.onlineOnly = false;
    startProjectButton.click = startProject;

    $rootScope.PageHeaderButtons = [startProjectButton];

    var un = $scope.$watch(
      function() {
        return localStorageService.get('user');
      },
      function(u) {
        if (u != null) {
          user = u;
          tableConfig.filters.profile = user.id;
          $scope.tableConfig = tableConfig;
          un();
        }
      }
    );

    setTableResource();
    conn.on('project-connectivity', function(event) {
      startProjectButton.visible = event.event === 'online';
      setTableResource();
    });
  }
]);
