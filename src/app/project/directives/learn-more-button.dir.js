angular.module('app.project').directive('learnMoreButton', [
  'ModalService',
  function(ModalService) {
    'use strict';
    return {
      restrict: 'EA',
      templateUrl: 'app/project/directives/learn-more-button.tpl.html',
      link: function(scope) {
        scope.modalConfig = {
          bodyTemplateUrl:
            'app/_mermaid_common/libs/partials/more-info-table.tpl.html',
          controller: 'MoreInfoModalCtrl'
        };

        scope.modalTrigger = function() {
          ModalService.open(scope.modalConfig);
        };
      }
    };
  }
]);
