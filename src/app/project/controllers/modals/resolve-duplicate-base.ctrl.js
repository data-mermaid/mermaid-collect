/*

To inherit this controller:

Example:

...
var $ctrl = this;
$ctrl.attributes = [...];
$ctrl.modalTitle = '...';
$ctrl.projectTableFx = OfflineTableUtils.ProjectSitesTable;
$ctrl.replaceEndpoint = '/find_and_replace_sites/';
$ctrl.buttonObjLabel = 'site';
$ctrl.note = 'Site notes will be combined into the site being kept.';
$ctrl.recordLink = function(record) {
  if (!angular.isDefined(record)) return '';
  return 'app.project.site({ id: "' + record.id + '" })';
};
$controller('ResolveDuplicateBase', {$scope: $scope, $ctrl: $ctrl});
...
...
$ctrl.init();

*/

angular.module('app.project').controller('ResolveDuplicateBase', [
  '$scope',
  '$stateParams',
  '$ctrl',
  'Button',
  'ProjectService',
  function($scope, $stateParams, $ctrl, Button, ProjectService) {
    'use strict';

    let $uibModalInstance = $ctrl.$uibModalInstance;
    let similarObjs = $ctrl.similarObjs;
    $scope.modalTitle = $ctrl.modalTitle;
    $scope.buttonObjLabel = $ctrl.buttonObjLabel;
    $scope.note = $ctrl.note;
    $scope.recordLink = $ctrl.recordLink;
    $ctrl.projectId = $stateParams.project_id;

    let getValue = function(record, attribute) {
      if (_.isFunction(attribute)) {
        return attribute(record);
      }
      return _.get(record, attribute);
    };

    let getDisplayValues = function(records) {
      return _.map($ctrl.attributes, function(attribute) {
        let entry = {
          label: attribute.display,
          values: [],
          isSameValues: false
        };
        for (let i = 0; i < records.length; i++) {
          entry.values.push(getValue(records[i], attribute.attribute));
        }
        entry.isSameValues = entry.values.every(function(val) {
          return entry.values[0] === val;
        });
        return entry;
      });
    };

    $ctrl.loadSimilarObjSet = function(objs) {
      $scope.records = objs;
      $scope.toggledObj = null;
      $scope.displayValues = getDisplayValues($scope.records);
    };

    $ctrl.replaceObjs = function() {
      if ($scope.toggledObj == null) return;
      let replaceObjId = $scope.toggledObj.id;
      let findObjIds = _.map(
        $scope.records.filter(function(record) {
          return record.id !== replaceObjId;
        }),
        'id'
      );
      return ProjectService.replaceObjs(
        $ctrl.projectId,
        $ctrl.replaceEndpoint,
        findObjIds,
        replaceObjId
      ).then(function() {
        if (similarObjs.length > 0) {
          $ctrl.loadSimilarObjSet(similarObjs.shift());
        } else {
          ProjectService.refreshTable($ctrl.projectId, $ctrl.projectTableFx);
          $uibModalInstance.close();
        }
      });
    };

    $scope.toggleObj = function(obj, colIndex) {
      $scope.toggledObj = obj;
      $scope.toggledColIndex = colIndex;
    };

    let okBtn = new Button();
    okBtn.name = 'OK';
    okBtn.enabled = true;
    okBtn.classes = 'btn-success';
    okBtn.click = function() {
      $ctrl.replaceObjs();
    };

    let cancelBtn = new Button();
    cancelBtn.classes = 'btn-default';
    cancelBtn.name = 'Cancel';
    cancelBtn.enabled = true;
    cancelBtn.click = function() {
      $uibModalInstance.dismiss();
    };

    $scope.$modalButtons = [okBtn, cancelBtn];
    $scope.mapopts = {
      defaultZoom: 8,
      zoomControl: false,
      gestureHandling: true
    };

    $ctrl.init = function() {
      $ctrl.loadSimilarObjSet(similarObjs.shift());
    };
  }
]);
