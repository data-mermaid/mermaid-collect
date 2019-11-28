angular.module('app.project').controller('ProjectCtrl', [
  '$rootScope',
  '$scope',
  'connectivity',
  '$state',
  '$stateParams',
  'ConnectivityFactory',
  'utils',
  'Button',
  'ProjectService',
  'tags',
  'projectsTable',
  'project',
  'projectProfile',
  'dataPolicies',
  'OfflineTableBackup',
  function(
    $rootScope,
    $scope,
    connectivity,
    $state,
    $stateParams,
    ConnectivityFactory,
    utils,
    Button,
    ProjectService,
    tags,
    projectsTable,
    project,
    projectProfile,
    dataPolicies,
    OfflineTableBackup
  ) {
    'use strict';

    var project_id = $stateParams.project_id;
    var _isUserProjectAdmin = false;
    var conn = new ConnectivityFactory($scope);

    $scope.project = project;
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
      _isUserProjectAdmin = projectProfile && projectProfile.is_admin;
      $scope.isDisabled = !_isUserProjectAdmin || !connectivity.isOnline;
    }

    $scope.benthicPolicies.data_policy_benthics =
      project.data_policy_benthiclit;
    $scope.projectStatuses.isTest =
      project.status === utils.project_statuses.test;

    ProjectService.setupFormDataPolicies($scope, dataPolicies);

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
        return projectsTable.create($scope.project).then(function(project) {
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

    var backupProject = function() {
      OfflineTableBackup.backupProject(project_id).then(function() {
        utils.showAlert(
          'Backup',
          'Project successfully backed up',
          utils.statuses.success
        );
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

    var backupProjectButton = new Button();
    backupProjectButton.name = 'Back up';
    backupProjectButton.enabled = true;
    backupProjectButton.visible = connectivity.isOnline;
    backupProjectButton.classes = 'btn-success';
    backupProjectButton.icon = 'fa fa-download';
    backupProjectButton.onlineOnly = false;
    backupProjectButton.click = backupProject;

    $rootScope.PageHeaderButtons = [saveButton, backupProjectButton];

    conn.on('project-details', function(event) {
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
