angular.module('app.project').controller('SiteCtrl', [
  'APP_CONFIG',
  '$rootScope',
  '$scope',
  '$state',
  '$stateParams',
  'ProjectService',
  'SiteService',
  'Button',
  'utils',
  'connectivity',
  'logger',
  'site',
  'choices',
  'projectProfile',
  function(
    APP_CONFIG,
    $rootScope,
    $scope,
    $state,
    $stateParams,
    ProjectService,
    SiteService,
    Button,
    utils,
    connectivity,
    logger,
    site,
    choices,
    projectProfile
  ) {
    'use strict';

    var projectId = $stateParams.project_id;
    $scope.site = site;
    $scope.isDisabled = ProjectService.isFormDisabled(
      projectProfile,
      ProjectService.COLLECTOR_ROLE
    );
    $scope.choices = choices;
    $scope.isOnline = connectivity.isOnline;

    $scope.save = function() {
      var isNew = $scope.site.id == null;
      SiteService.save($scope.site, { projectId: projectId })
        .then(function(savedSite) {
          if (isNew) {
            var params = {
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
        })
        .catch(function(error) {
          logger.error('save_site', error);
          utils.errorAlert(error);
          return error;
        });
    };

    var saveButton = new Button();
    saveButton.name = 'Save';
    saveButton.enabled = false;
    saveButton.visible = true;
    saveButton.classes = 'btn-success';
    saveButton.icon = 'fa fa-save';
    saveButton.click = $scope.save;
    saveButton.onlineOnly = false;

    $rootScope.PageHeaderButtons = [saveButton];

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
