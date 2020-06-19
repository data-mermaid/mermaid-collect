angular
  .module('mermaid.libs')
  .controller('SampleEventModalCtrl', function(
    $scope,
    $uibModalInstance,
    pageContent,
    TransectService,
    $stateParams,
    SampleEventService
  ) {
    'use strict';

    const projectId = $stateParams.project_id;
    let saveCallback;
    $scope.choices = {};
    $scope.isDisabled = true;

    _.merge($scope, pageContent);

    const loadData = function(project_id, sample_event_id) {
      TransectService.getLookups(project_id).then(function(transect) {
        $scope.choices = transect.choices;
      });

      SampleEventService.fetchData(project_id, sample_event_id).then(function(
        sample_event
      ) {
        $scope.sample_event = sample_event;
      });
    };

    $scope.saveModal = function() {
      console.log('Save');
      console.log('$scope.sample_event ', $scope.sample_event);
      SampleEventService.save($scope.sample_event, projectId).then(function(
        savedSampleEvent
      ) {
        $uibModalInstance.close(savedSampleEvent);
        saveCallback();
      });
    };
    $scope.cancelModal = function() {
      $uibModalInstance.dismiss('cancel');
    };

    const un = $scope.$watch('controllerOptions', function() {
      if ($scope.controllerOptions == null) {
        return;
      }
      const sampleEventId = $scope.controllerOptions.recordId;
      saveCallback = $scope.controllerOptions.saveCallback;
      loadData(projectId, sampleEventId);
      un();
    });

    $uibModalInstance.rendered.then(function() {
      $scope.loadModalBody($scope);
    });
  });
