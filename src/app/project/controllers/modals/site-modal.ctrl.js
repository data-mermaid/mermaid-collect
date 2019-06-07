angular
  .module('mermaid.libs')
  .controller('SiteModalCtrl', function(
    $scope,
    $uibModalInstance,
    pageContent,
    $stateParams,
    offlineservice,
    ProjectService,
    SiteService
  ) {
    'use strict';

    var siteId;
    var saveCallback;
    var projectId = $stateParams.project_id;
    $scope.choices = {};
    $scope.isDisabled = true;

    _.merge($scope, pageContent);

    var loadData = function(projectId, siteId) {
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
    };

    $scope.saveModal = function() {
      SiteService.save($scope.site).then(function(savedSite) {
        $uibModalInstance.close(savedSite);
        saveCallback(savedSite.id, savedSite.name);
      });
    };

    $scope.cancelModal = function() {
      $uibModalInstance.dismiss('cancel');
    };

    var un = $scope.$watch('controllerOptions', function() {
      if ($scope.controllerOptions == null) {
        return;
      }
      siteId = $scope.controllerOptions.recordId;
      saveCallback = $scope.controllerOptions.saveCallback;
      loadData(projectId, siteId);
      un();
    });

    $uibModalInstance.rendered.then(function() {
      $scope.loadModalBody($scope);
    });
  });
