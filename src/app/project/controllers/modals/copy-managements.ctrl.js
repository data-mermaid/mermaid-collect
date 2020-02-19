angular.module('app.project').controller('CopyManagementsCtrl', [
  '$uibModalInstance',
  '$scope',
  '$q',
  '$stateParams',
  'Management',
  'offlineservice',
  'utils',
  'Button',
  'PaginatedArrayWrapper',
  'CopyManagementsService',
  function(
    $uibModalInstance,
    $scope,
    $q,
    $stateParams,
    Management,
    offlineservice,
    utils,
    Button,
    PaginatedArrayWrapper,
    CopyManagementsService
  ) {
    'use strict';

    var cancelButton;
    var copyButton;
    var projectId = $stateParams.project_id;
    var service = {};
    var srcRecordFilter = { unique: projectId, exclude_projects: projectId };

    $scope.selectedRecords = [];

    var toggleViewSelectedOnly = function(selectedOnly) {
      if (selectedOnly) {
        var records = $scope.control.getSelectedRecords();
        $scope.resource = PaginatedArrayWrapper(records, {
          searchFields: ['name', 'name_secondary', 'project_name', 'est_year']
        });
      } else {
        $scope.resource = Management;
      }
      $scope.control.refresh(true);
    };

    service = _.assign(CopyManagementsService, {});
    $scope.control = service.control;
    $scope.resource = service.resource;
    $scope.config = service.config;
    $scope.config.filters = _.merge($scope.config.filters, srcRecordFilter);
    $scope.config.toolbar.toggleViewSelectedOnly = toggleViewSelectedOnly;

    var setButtonEnable = function(isEnabled) {
      cancelButton.enabled = isEnabled;
      copyButton.enabled = isEnabled;
    };

    var copyManagements = function() {
      setButtonEnable(false);
      var records = $scope.control.getSelectedRecords();
      var recordCount = records.length;
      return offlineservice
        .ProjectManagementsTable(projectId)
        .then(function(managementsTable) {
          var promises = _.map(records, function(management) {
            management.predecessor = management.id;
            management.project = projectId;
            management.id = null;
            return managementsTable.create(management);
          });

          return $q.all(promises).then(function() {
            var message = 'Added ' + recordCount + ' ';
            message += utils.pluralize(
              recordCount,
              'management',
              'managements'
            );
            $uibModalInstance.close('cancel');
            utils.showAlert('Success', message, utils.statuses.success);
          });
        })
        .finally(function() {
          setButtonEnable(true);
        });
    };

    $scope.$on('paginatedtable:toggle-selected', function() {
      $scope.selectedRecords = $scope.control.getSelectedRecords();
    });

    $scope.$on('paginatedtable:clear-selected', function() {
      $scope.selectedRecords = $scope.control.getSelectedRecords();
    });

    // DEFINE MODAL BUTTONS

    cancelButton = new Button();
    cancelButton.enabled = true;
    cancelButton.name = 'Cancel';
    cancelButton.classes = 'btn-default';
    cancelButton.click = function() {
      $uibModalInstance.dismiss('cancel');
      $scope.config.toolbar.viewSelectedOnly = false;
    };

    copyButton = new Button();
    copyButton.enabled = true;
    copyButton.name = 'Copy selected to project';
    copyButton.classes = 'btn-success';
    copyButton.click = function() {
      copyManagements();
    };

    $scope.$modalButtons = [copyButton, cancelButton];
  }
]);
