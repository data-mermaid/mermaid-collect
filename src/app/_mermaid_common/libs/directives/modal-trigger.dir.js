/**
 * NOTES:
 * - modalBodyTemplateUrl: for now, assuming the form name attritue is "form"
 *   example <form name="form" novalidate> ... </form>
 */

angular
  .module('mermaid.libs')
  .directive('modalTrigger', [
    '$uibModal',
    '$compile',
    '$templateRequest',
    '$window',
    function($uibModal, $compile, $templateRequest, $window) {
      'use strict';
      return {
        restrict: 'A',
        requires: 'model',
        scope: {
          modalBodyTemplateUrl: '=',
          modalController: '=',
          modalTitle: '=',
          modalConfirmLabel: '=',
          modalNextLabel: '=',
          modalSection: '=',
          modalSetSection: '=',
          modalNumSections: '=',
          ngModel: '=?',
          saveCallback: '='
        },
        link: function(scope, elem) {
          var $elem = $(elem);
          var modalTemplate =
            'app/_mermaid_common/libs/directives/modal-trigger.tpl.html';
          var openModal = function(
            title,
            modalNextLabel,
            modalSection,
            modalNumSections,
            modalSetSection,
            confirmLabel
          ) {
            $window.document.activeElement.blur();
            var controllerOptions = {
              recordId: scope.ngModel,
              saveCallback: scope.saveCallback
            };
            return $uibModal.open({
              templateUrl: modalTemplate,
              controller: scope.modalController,
              size: 'lg',
              backdrop: 'static',
              resolve: {
                pageContent: function() {
                  var templatePath = scope.modalBodyTemplateUrl;
                  var loadModalBody = function(ctrlScope) {
                    $templateRequest(templatePath).then(function(response) {
                      var tmpl = response;
                      $('#modal-body').html($compile(tmpl)(ctrlScope));
                    });
                  };
                  return {
                    loadModalBody: loadModalBody,
                    modalTitle: title,
                    modalConfirmLabel: confirmLabel,
                    modalNextLabel: modalNextLabel,
                    modalSection: modalSection,
                    modalSetSection: modalSetSection,
                    modalNumSections: modalNumSections,
                    controllerOptions: controllerOptions
                  };
                }
              }
            });
          };

          $elem.click(function() {
            openModal(
              scope.modalTitle,
              scope.modalNextLabel,
              scope.modalSection,
              scope.modalNumSections,
              scope.modalSetSection,
              scope.modalConfirmLabel
            );
          });
        }
      };
    }
  ])
  .directive('initData', [
    '$parse',
    function($parse) {
      'use strict';
      return {
        restrict: 'A',
        link: function(scope, elem, attrs) {
          var data = $parse(attrs.initData);
          data(scope.$parent);
        }
      };
    }
  ]);
