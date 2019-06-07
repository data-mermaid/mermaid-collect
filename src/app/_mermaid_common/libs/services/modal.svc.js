/*

  Bootstrap Angular-UI Modal Options
  ----------------------------------

  * size (string) Allowed values: 'sm', 'lg', default 'lg'
  * backdrop (boolean/string) Allowed values: true (backdrop), false (no backdrop), 'static' (disables modal closing by click on the backdrop), default: 'static'.
  * templateUrl (string): Template url for the modal, defaults: 'app/_mermaid_common/libs/partials/modal.tpl.html'
  * controller (string/object) Modal instance controller, defaults:  null
  
  Options applied to Modal Controller's $scope
  --------------------------------------------

  * hideHeader (boolean) Hide modal header, default: false.
  * bodyTemplateUrl (string) Modal body template url, default: null.
  * modalOptions (object) Pass any extra options for use in the controller.
  
  
  System attributes added to modal instance $scope
  ------------------------------------------------

  * $modalButtons (Array<mermaid.libs.Button>) Define modal buttons, default: [].

  Example: Setting up modal buttons in the modal instance controller

  ``` 
    // Button ==> mermaid.libs.Button

    cancelButton = new Button();
    cancelButton.enabled = true;
    cancelButton.name = 'Cancel';
    cancelButton.classes = 'btn-default';
    cancelButton.click = function() {
      $uibModalInstance.dismiss('cancel');
    };

    copyButton = new Button();
    copyButton.enabled = true;
    copyButton.name = 'Copy selected to project';
    copyButton.classes = 'btn-success';
    copyButton.click = function() {
      copySites();
    };

    $scope.$modalButtons = [copyButton, cancelButton];```

  METHODS
  -------
  open: Open modal, accepts options argument, see option details above.
    @returns Modal instance.

  Example:

  ```
  btn.click(function() {
    var modal;
    var modalOptions = {
      hideHeader: true,
      controller: 'CopySitesCtrl',
      bodyTemplateUrl: 'app/project/partials/copy-sites.tpl.html'
    };
    modal = ModalService.open(modalOptions);
    modal.result.then(function() {
      $scope.tableControl.refresh();
    });
  });
  ```

*/

angular.module('mermaid.libs').service('ModalService', [
  '$q',
  '$rootScope',
  '$uibModal',
  function($q, $rootScope, $uibModal) {
    'use strict';

    var service = {};

    var modalDefaults = {
      size: 'lg',
      backdrop: 'static',
      templateUrl: 'app/_mermaid_common/libs/partials/modal.tpl.html',
      controller: null,
      resolve: null
    };

    var scopeDefaults = {
      hideHeader: false,
      bodyTemplateUrl: null,
      modalOptions: {}
    };

    var applyOptions = function(options) {
      options = options || {};
      var config = _.extend({}, modalDefaults);

      for (let key in modalDefaults) {
        if (options[key]) {
          config[key] = options[key];
        }
      }

      // Apply options that need to live in the scope
      var scope = $rootScope.$new(true);
      scope.$modalButtons = [];
      for (let key in scopeDefaults) {
        if (options[key]) {
          scope[key] = options[key];
        }
      }

      config.scope = scope;
      return config;
    };

    var openModal = function(config) {
      return $uibModal.open(config);
    };

    service.open = function(options) {
      var config = applyOptions(options);
      var modal = openModal(config);
      return modal;
    };

    return service;
  }
]);
