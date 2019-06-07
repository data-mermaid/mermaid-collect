angular.module('app.project').controller('ProjectCtrl', [
  '$rootScope',
  '$scope',
  'connectivity',
  '$state',
  '$stateParams',
  '$q',
  'offlineservice',
  'ConnectivityFactory',
  'utils',
  'Button',
  'ProjectService',
  'tags',
  function(
    $rootScope,
    $scope,
    connectivity,
    $state,
    $stateParams,
    $q,
    offlineservice,
    ConnectivityFactory,
    utils,
    Button,
    ProjectService,
    tags
  ) {
    'use strict';

    var project_table;
    var project_id = $stateParams.project_id;
    var _isUserProjectAdmin = false;
    var conn = new ConnectivityFactory($scope);

    $scope.project = {};
    $scope.benthicPolicies = {};
    $scope.isDisabled = true;
    $scope.tags = _.uniq(tags.results, 'id');
    $scope.organization = {};
    $scope.projectStatuses = {};

    if (project_id === null) {
      // New project
      _isUserProjectAdmin = true;
      $scope.isDisabled = !_isUserProjectAdmin || !connectivity.isOnline;
    } else {
      ProjectService.getMyProjectProfile(project_id).then(function(
        project_profile
      ) {
        _isUserProjectAdmin = project_profile && project_profile.is_admin;
        $scope.isDisabled = !_isUserProjectAdmin || !connectivity.isOnline;
      });
    }

    offlineservice.ProjectsTable(project_id).then(function(table) {
      project_table = table;
      if (project_id == null) {
        return $q.resolve();
      }
      return table.get(project_id).then(function(record) {
        $scope.project = record;
        $scope.benthicPolicies.data_policy_benthics =
          record.data_policy_benthiclit; // Assume (for now) all benthic transect data policies are the same
        $scope.projectStatuses.isTest =
          record.status === utils.project_statuses.test;
      });
    });

    offlineservice
      .ChoicesTable()
      .then(function(table) {
        return table.filter({ name: 'datapolicies' });
      })
      .then(function(result) {
        ProjectService.setupFormDataPolicies($scope, result[0].data);
      });

    $scope.setBenthicPolicies = function(policy) {
      $scope.project.data_policy_benthiclit = policy;
      $scope.project.data_policy_benthicpit = policy;
      $scope.project.data_policy_habitatcomplexity = policy;
    };

    $scope.setTestStatus = function(status) {
      $scope.project.status =
        utils.truthy(status) === true
          ? utils.project_statuses.test
          : utils.project_statuses.open;
    };

    var save = function() {
      if (!$scope.project.id) {
        return project_table.create($scope.project).then(function(project) {
          var params = {
            project_id: project.id
          };
          $scope.form.$setPristine(true);
          $state.go('app.project.records', params);
        });
      }
      return $scope.project.update().then(function() {
        $scope.form.$setPristine(true);
      });
    };

    var saveButton = new Button();
    saveButton.name = 'Save';
    saveButton.enabled = false;
    saveButton.visible = connectivity.isOnline;
    saveButton.classes = 'btn-success';
    saveButton.icon = 'fa fa-save';
    saveButton.onlineOnly = false;
    saveButton.click = save;

    $rootScope.PageHeaderButtons = [saveButton];

    conn.on('profile', function(event) {
      saveButton.visible = event.event === 'online';
      $scope.isDisabled = !_isUserProjectAdmin || event.event !== 'online';
    });

    $scope.$watch(
      function() {
        return $scope.form && $scope.form.$dirty && $scope.form.$valid;
      },
      function(v) {
        saveButton.enabled = v && !$scope.isDisabled;
      }
    );
  }
]);
