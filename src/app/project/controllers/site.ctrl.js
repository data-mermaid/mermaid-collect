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
  'choices',
  'site',
  'project',
  'projectProfile',
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
    choices,
    site,
    project,
    projectProfile
  ) {
    'use strict';

    const conn = new ConnectivityFactory($scope);
    const projectId = $stateParams.project_id;

    $scope.isDisabled = ProjectService.isFormDisabled(
      projectProfile,
      ProjectService.COLLECTOR_ROLE
    );
    $scope.site = site;
    $scope.choices = choices;
    $scope.siteState = connectivity.isOnline ? 'online' : 'offline';

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
          project.update();
          $scope.form.$setPristine(true);
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
