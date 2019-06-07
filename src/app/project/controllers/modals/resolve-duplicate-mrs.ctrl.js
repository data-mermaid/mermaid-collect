angular.module('app.project').controller('ResolveDuplicateMRsCtrl', [
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
    $ctrl.modalTitle = 'Select management regime to keep?';
    $ctrl.projectTableFx = offlineservice.ProjectManagementsTable;
    $ctrl.replaceEndpoint = '/find_and_replace_managements/';
    $ctrl.buttonObjLabel = 'MR';
    $ctrl.note =
      'Management regime notes will be combined into the management regime being kept.';
    $ctrl.recordLink = function(record) {
      if (!angular.isDefined(record)) return '';
      return 'app.project.management({ id: "' + record.id + '" })';
    };

    $ctrl.attributes = [
      {
        attribute: function(record) {
          let name = record.name;
          if (!_.isEmpty(record.name_secondary)) {
            name += ' [' + record.name_secondary + ']';
          }
          return name;
        },
        display: 'Name'
      },
      { attribute: 'est_year', display: 'Year established' },
      { attribute: 'size', display: 'Area (ha)' },
      {
        attribute: function(record) {
          let parties_names = [];
          _.each(record.parties, function(party_id) {
            parties_names.push(
              $filter('matchchoice')(party_id, choices.managementparties)
            );
          });
          return parties_names.join(', ') || '';
        },
        display: 'Parties'
      },
      {
        attribute: function(record) {
          return $filter('matchchoice')(
            record.compliance,
            choices.managementcompliances
          );
        },
        display: 'Compliance'
      },
      {
        attribute: function(record) {
          let rules = [];
          if (record.open_access === true) rules.push('open access');
          if (record.no_take === true) rules.push('no take');
          if (record.gear_restriction === true) rules.push('gear restrictions');
          if (record.periodic_closure === true) rules.push('periodic closure');
          if (record.size_limits === true) rules.push('size limits');
          if (record.species_restriction === true)
            rules.push('species restrictions');
          return rules.join(', ') || '';
        },
        display: 'Rules'
      },
      { attribute: 'notes', display: 'Notes<sup>+</sup>' }
    ];

    $controller('ResolveDuplicateBase', { $scope: $scope, $ctrl: $ctrl });

    $ctrl.init();
  }
]);
