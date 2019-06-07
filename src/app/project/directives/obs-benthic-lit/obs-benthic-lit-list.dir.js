angular.module('app.project').directive('obsBenthicLitList', [
  'offlineservice',
  'TransectService',
  'utils',
  '$timeout',
  'BenthicAttributeService',
  'ModalService',
  function(
    offlineservice,
    TransectService,
    utils,
    $timeout,
    BenthicAttributeService,
    ModalService
  ) {
    'use strict';
    return {
      restrict: 'EA',
      require: '^form',
      scope: {
        obsBenthicLits: '=',
        benthicAttributeChoices: '=',
        isDisabled: '=?'
      },
      templateUrl:
        'app/project/directives/obs-benthic-lit/obs-benthic-lit-list.tpl.html',
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
          var index = scope.obsBenthicLits.indexOf(obs);
          return _.parseInt(index) + 1 || scope.obsBenthicLits.length;
        };

        scope.addRow = function($event, observation) {
          if (scope.isDisabled === true) {
            return;
          }

          scope.obsBenthicLits = scope.obsBenthicLits || [];
          var nextIndex = scope.getNextIndex(observation);
          var nextCol = 'attr';
          var newRecord = {}; // simple add row

          if (!$event || $event.keyCode === 13 || $event.keyCode === 9) {
            if ($event && $event.keyCode === 9) {
              // if tab, duplicate row and focus on val
              nextCol = 'length';
              newRecord = _.omit(observation, [
                'id',
                '$$hashKey',
                nextCol,
                '$$uid'
              ]);
            }
            utils.assignUniqueId(newRecord);
            scope.obsBenthicLits.splice(nextIndex, 0, newRecord);
            $timeout(function() {
              var $elm = $($table.find('tr')[nextIndex + 1]);
              $($elm.find('input')[0]).focus();
            }, 0);
          }
        };

        scope.deleteRow = function(observation) {
          if (scope.isDisabled === true) {
            return;
          }

          scope.obsBenthicLits = scope.obsBenthicLits || [];
          var idx = scope.obsBenthicLits.indexOf(observation);
          if (idx !== -1) {
            scope.obsBenthicLits.splice(idx, 1);
          }
          formCtrl.$setDirty();
        };

        var _updateBenthicPercentages = function() {
          $timeout.cancel(watchTimeoutPromise);
          loadBenthicAttributesLookup();
          watchTimeoutPromise = $timeout(function() {
            scope.observation_calcs = TransectService.calcBenthicPercentages(
              scope.obsBenthicLits,
              scope.benthicAttributesLookup
            );
          }, 300);
        };

        scope.onModalSave = function() {
          _updateBenthicPercentages();
        };

        scope.$watch(
          'obsBenthicLits',
          function() {
            utils.assignUniqueId(scope.obsBenthicLits);
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
