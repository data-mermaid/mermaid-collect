angular.module('app.project').directive('learnMoreButton', [
  'ModalService',
  function(ModalService) {
    'use strict';
    return {
      restrict: 'EA',
      scope: {
        isIcon: '=?'
      },
      templateUrl: 'app/project/directives/learn-more-button.tpl.html',
      link: function(scope, element, attrs) {
        scope.iconButton = attrs.isIcon && 'icon-button';
        scope.modalConfig = {
          bodyTemplateUrl:
            'app/_mermaid_common/libs/partials/datasharing-info.tpl.html',
          controller: 'DatasharingInfoModalCtrl'
        };

        scope.modalTrigger = function() {
          ModalService.open(scope.modalConfig);
        };
      }
    };
  }
]);
