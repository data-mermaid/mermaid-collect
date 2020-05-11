angular.module('app.project').controller('SiteCtrl', [
  '$rootScope',
  '$scope',
  '$state',
  '$stateParams',
  'ProjectService',
  'SiteService',
  'Button',
  'utils',
  'connectivity',
  'ConnectivityFactory',
  'logger',
  'project',
  function(
    $rootScope,
    $scope,
    $state,
    $stateParams,
    ProjectService,
    SiteService,
    Button,
    utils,
    connectivity,
    ConnectivityFactory,
    logger,
    project
  ) {
    'use strict';

    const siteId = $stateParams.id;
    const projectId = $stateParams.project_id;
    const conn = new ConnectivityFactory($scope);
    $scope.isDisabled = true;
    $scope.choices = {};
    $scope.siteState = connectivity.isOnline ? 'online' : 'offline';

    ProjectService.getMyProjectProfile(projectId).then(function(
      projectProfile
    ) {
      $scope.isDisabled = ProjectService.isFormDisabled(
        projectProfile,
        ProjectService.COLLECTOR_ROLE
      );
    });

    ProjectService.fetchChoices().then(function(choices) {
      $scope.choices = choices;
    });

    SiteService.fetchData(projectId, siteId).then(function(site) {
      $scope.site = site;
    });

    const save = function() {
      const isNew = $scope.site.id == null;
      SiteService.save($scope.site, { projectId: projectId })
        .then(function(savedSite) {
          if (isNew) {
            const params = {
              project_pk: projectId,
              id: savedSite.id
            };
            $scope.site = savedSite;
            $state.transitionTo('app.project.sites.site', params, {
              location: true,
              inherit: true,
              relative: $state.$current,
              notify: false
            });
          }
          $scope.form.$setPristine(true);
          project.update();
        })
        .catch(function(error) {
          logger.error('save_site', error);
          utils.errorAlert(error);
          return error;
        });
    };

    const saveButton = new Button();
    saveButton.name = 'Save';
    saveButton.enabled = false;
    saveButton.visible = true;
    saveButton.classes = 'btn-success';
    saveButton.icon = 'fa fa-save';
    saveButton.click = save;
    saveButton.onlineOnly = false;
    $scope.save = save;

    $rootScope.PageHeaderButtons = [saveButton];

    conn.on('site', function(event) {
      $scope.siteState = event.event;
    });

    $scope.$watch(
      function() {
        return $scope.form && $scope.form.$valid && $scope.form.$dirty;
      },
      function(v) {
        saveButton.enabled = v && !$scope.isDisabled;
      }
    );
  }
]);
