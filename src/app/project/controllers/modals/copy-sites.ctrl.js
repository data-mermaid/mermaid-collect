angular.module('app.project').controller('CopySitesCtrl', [
  '$uibModalInstance',
  '$scope',
  '$q',
  '$stateParams',
  'Site',
  'OfflineTableUtils',
  'utils',
  'Button',
  'PaginatedArrayWrapper',
  'CopySitesService',
  function(
    $uibModalInstance,
    $scope,
    $q,
    $stateParams,
    Site,
    OfflineTableUtils,
    utils,
    Button,
    PaginatedArrayWrapper,
    CopySitesService
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
          searchFields: ['name', 'project_name', 'country_name']
        });
      } else {
        $scope.resource = Site;
      }
      $scope.control.refresh(true);
    };

    service = _.assign(CopySitesService, {});
    $scope.control = service.control;
    $scope.resource = service.resource;
    $scope.choices = utils.choices;
    $scope.config = service.config;
    $scope.config.filters = _.merge($scope.config.filters, srcRecordFilter);
    $scope.config.toolbar.toggleViewSelectedOnly = toggleViewSelectedOnly;

    var setButtonEnable = function(isEnabled) {
      cancelButton.enabled = isEnabled;
      copyButton.enabled = isEnabled;
    };

    var copySites = function() {
      setButtonEnable(false);
      var records = $scope.control.getSelectedRecords();
      var recordCount = records.length;
      return OfflineTableUtils.ProjectSitesTable(projectId)
        .then(function(sitesTable) {
          var promises = _.map(records, function(site) {
            site.predecessor = site.id;
            site.project = projectId;
            site.id = null;
            return sitesTable.create(site);
          });

          return $q.all(promises).then(function() {
            var message = 'Added ' + recordCount + ' ';
            message += utils.pluralize(recordCount, 'site', 'sites');
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
      copySites();
    };

    $scope.$modalButtons = [copyButton, cancelButton];
    $scope.mapopts = {
      gestureHandling: true
    };
  }
]);
