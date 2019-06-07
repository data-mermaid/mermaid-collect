angular.module('app.project').directive('obsBenthicPitList', [
  'offlineservice',
  'utils',
  '$timeout',
  'TransectService',
  'ModalService',
  'BenthicAttributeService',
  function(
    offlineservice,
    utils,
    $timeout,
    TransectService,
    ModalService,
    BenthicAttributeService
  ) {
    'use strict';
    return {
      restrict: 'EA',
      require: '^form',
      scope: {
        obsBenthicPits: '=',
        benthicAttributeChoices: '=',
        transectLengthSurveyed: '=',
        intervalSize: '=',
        isDisabled: '=?'
      },
      templateUrl:
        'app/project/directives/obs-benthic-pit/obs-benthic-pit-list.tpl.html',
      link: function(scope, element, attrs, formCtrl) {
        var modal;
        var $table = $(element).find('table');
        var watchTimeoutPromise;

        scope.observation_calcs = {};
        scope.categoryLookup = {};
        scope.isDisabled = utils.truthy(scope.isDisabled);
        scope.choices = {};

        var loadBenthicAttributesLookup = function() {
          scope.benthicAttributesLookup = utils.createLookup(
            scope.benthicAttributeChoices
          );
        };
        loadBenthicAttributesLookup();

        scope.getBenthicAttributes = function() {
          return scope.benthicAttributeChoices;
        };

        scope.categoryLookup = BenthicAttributeService.getCategoryLookup(
          scope.benthicAttributeChoices
        );

        scope.modalConfig = {
          bodyTemplateUrl:
            'app/_mermaid_common/libs/partials/benthicattribute-input-new.tpl.html',
          controller: 'BenthicAttributeModalCtrl'
        };

        scope.modalTrigger = function(observation) {
          modal = ModalService.open(scope.modalConfig);
          modal.result.then(function(record) {
            scope.benthicAttributeChoices.push(record);
            loadBenthicAttributesLookup();
            observation.attribute = record.id;
            _updateBenthicPercentages();
            utils.showAlert(
              'Proposal submitted',
              'Your proposal will be reviewed by the MERMAID team.',
              utils.statuses.success
            );
          });
        };

        offlineservice.ChoicesTable(true).then(function(table) {
          return table.filter().then(function(choices) {
            _.each(choices, function(c) {
              scope.choices[c.name] = c.data;
            });
          });
        });

        scope.getNextIndex = function(obs) {
          var index = scope.obsBenthicPits.indexOf(obs);
          return _.parseInt(index) + 1 || scope.obsBenthicPits.length;
        };

        scope.addRow = function($event, observation) {
          if (scope.isDisabled === true) {
            return;
          }

          scope.obsBenthicPits = scope.obsBenthicPits || [];
          // The comma causes the benthic attribute to be
          // cleared, need to keep track of it.
          var benthicAttribute = observation ? observation.attribute : null;
          var nextIndex = scope.getNextIndex(observation);
          var nextCol = 'attr';
          var newRecord = {}; // simple add row

          if (!$event || $event.keyCode === 13 || $event.keyCode === 9) {
            if ($event && $event.keyCode === 9) {
              // if tab, duplicate row and focus on val
              nextCol = 'interval';
              newRecord = _.omit(observation, [
                'id',
                '$$hashKey',
                '$$uid',
                nextCol
              ]);
            }

            utils.assignUniqueId(newRecord);
            scope.obsBenthicPits.splice(nextIndex, 0, newRecord);
            $timeout(function() {
              if (observation) {
                observation.attribute = benthicAttribute;
              }
              var $elm = $($table.find('tr')[nextIndex + 1]);
              $($elm.find('input')[1]).focus();
            }, 0);
          }
        };

        scope.deleteRow = function(observation) {
          if (scope.isDisabled === true) {
            return;
          }

          scope.obsBenthicPits = scope.obsBenthicPits || [];
          var idx = scope.obsBenthicPits.indexOf(observation);
          if (idx !== -1) {
            scope.obsBenthicPits.splice(idx, 1);
          }
          formCtrl.$setDirty();
        };

        scope.$watch(
          'intervalSize',
          function(newVal, oldVal) {
            if (newVal == null || newVal === oldVal) {
              return;
            }

            TransectService.setObservationIntervals(
              scope.obsBenthicPits,
              scope.intervalSize
            );
          },
          true
        );

        var _updateBenthicPercentages = function() {
          $timeout.cancel(watchTimeoutPromise);
          watchTimeoutPromise = $timeout(function() {
            scope.observation_calcs = TransectService.calcBenthicPercentages(
              scope.obsBenthicPits,
              scope.benthicAttributesLookup
            );
          }, 300);
        };

        scope.$watch(
          'obsBenthicPits',
          function(newVal, oldVal) {
            if (newVal == null || newVal === oldVal) {
              return;
            }

            utils.assignUniqueId(scope.obsBenthicPits);

            TransectService.setObservationIntervals(
              scope.obsBenthicPits,
              scope.intervalSize
            );

            _updateBenthicPercentages();
          },
          true
        );

        scope.$watch(
          'categoryLookup',
          function() {
            _updateBenthicPercentages();
          },
          true
        );
      }
    };
  }
]);
