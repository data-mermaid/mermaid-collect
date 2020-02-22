angular.module('app.project').directive('resolveDuplicateObj', [
  '$q',
  '$stateParams',
  'ModalService',
  'ProjectService',
  'OfflineTableUtils',
  'ValidateDuplicationService',
  function(
    $q,
    $stateParams,
    ModalService,
    ProjectService,
    OfflineTableUtils,
    ValidateDuplicationService
  ) {
    'use strict';
    return {
      restrict: 'E',
      scope: {
        table: '=',
        controller: '@'
      },
      template:
        '<a href ng-if="$parent.$parent.isDisabled !== true">Resolve</a>',
      link: function(scope, element) {
        let modal;
        let projectId = $stateParams.project_id;

        let openModal = function(event) {
          event.preventDefault();

          let fetchSimilarObjs = function() {
            return ValidateDuplicationService.groupSimilarObjs(
              scope.table
            ).then(function(groupedSimilarObjs) {
              let fetchObjPromises = _.map(groupedSimilarObjs, function(
                similarObjsSet
              ) {
                return scope.table.filter({
                  id: function(val) {
                    return similarObjsSet.indexOf(val) !== -1;
                  }
                });
              });
              return $q.all(fetchObjPromises);
            });
          };

          let modalOptions = {
            controller: scope.controller,
            bodyTemplateUrl:
              'app/project/partials/resolve-duplicate-objs.tpl.html',
            resolve: {
              similarObjs: function() {
                return fetchSimilarObjs(projectId);
              },
              choices: function(ProjectService) {
                return ProjectService.fetchChoices();
              }
            }
          };

          modal = ModalService.open(modalOptions);
        };

        element.bind('click', openModal);
      }
    };
  }
]);
