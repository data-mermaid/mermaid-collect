angular.module('app.project').controller('ResolveDuplicateSitesCtrl', [
  '$controller',
  '$scope',
  '$uibModalInstance',
  '$filter',
  'similarObjs',
  'choices',
  'offlineservice',
  function(
    $controller,
    $scope,
    $uibModalInstance,
    $filter,
    similarObjs,
    choices,
    offlineservice
  ) {
    'use strict';

    let $ctrl = this;
    $ctrl.$uibModalInstance = $uibModalInstance;
    $ctrl.similarObjs = similarObjs;
    $ctrl.modalTitle = 'Select site to keep?';
    $ctrl.projectTableFx = offlineservice.ProjectSitesTable;
    $ctrl.replaceEndpoint = '/find_and_replace_sites/';
    $ctrl.buttonObjLabel = 'site';
    $ctrl.note = 'Site notes will be combined into the site being kept.';
    $ctrl.recordLink = function(record) {
      if (!angular.isDefined(record)) return '';
      return 'app.project.site({ id: "' + record.id + '" })';
    };

    $ctrl.attributes = [
      { attribute: 'name', display: 'Name' },
      { attribute: 'location.coordinates[1]', display: 'Latitude' },
      { attribute: 'location.coordinates[0]', display: 'Longitude' },
      { attribute: 'location', display: 'Map' },
      {
        attribute: function(record) {
          return $filter('matchchoice')(record.exposure, choices.reefexposures);
        },
        display: 'Exposure'
      },
      {
        attribute: function(record) {
          return $filter('matchchoice')(record.reef_type, choices.reeftypes);
        },
        display: 'Reef Type'
      },
      {
        attribute: function(record) {
          return $filter('matchchoice')(record.reef_zone, choices.reefzones);
        },
        display: 'Reef Zone'
      },
      { attribute: 'notes', display: 'Notes<sup>+</sup>' }
    ];

    $controller('ResolveDuplicateBase', { $scope: $scope, $ctrl: $ctrl });

    $ctrl.init();
  }
]);
