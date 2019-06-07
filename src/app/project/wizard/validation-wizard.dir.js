angular.module('app.project').directive('validationWizard', [
  '$q',
  '$uibModal',
  function($q, $uibModal) {
    'use strict';
    return {
      restrict: 'AE',
      scope: {
        recordInstance: '=',
        identifier: '=',
        config: '=',
        autoMoveNext: '=?',
        updateFx: '=',
        ignoreFx: '=?',
        closeCallback: '=?'
      },
      template: '<a href >Resolve</a>',
      link: function(scope, element) {
        scope.autoMoveNext = scope.autoMoveNext === false ? false : true;
        var openWizard = function(event) {
          event.preventDefault();

          var modalInstance = $uibModal.open({
            animation: true,
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            templateUrl:
              'app/project/wizard/validation-wizard-content.tpl.html',
            controller: 'validationModalInstance',
            controllerAs: '$ctrl',
            backdrop: 'static',
            keyboard: false,
            size: 'lg',
            resolve: {
              identifier: function() {
                return scope.identifier;
              },
              record: function() {
                return scope.recordInstance.createNewInstance();
              },
              autoMoveNext: function() {
                return scope.autoMoveNext;
              },
              wizardConfig: function() {
                return scope.config;
              },
              update: function() {
                return scope.updateFx;
              },
              ignore: function() {
                return scope.ignoreFx;
              }
            }
          });

          modalInstance.result.finally(function() {
            if (_.isFunction(scope.closeCallback)) {
              scope.closeCallback();
            }
          });
        };

        element.bind('click', openWizard);
      }
    };
  }
]);
