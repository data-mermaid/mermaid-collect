angular.module('mermaid.libs').factory('Button', [
  function() {
    'use strict';

    return function(options) {
      var Button = function() {};
      Button.prototype.visible = true;
      Button.prototype.enabled = false;
      Button.prototype.isvalid = true;
      Button.prototype.click = function() {
        console.log('Not implemented');
      };
      Button.prototype.icon = '';
      Button.prototype.classes = '';
      Button.prototype.name = '';
      Button.prototype.buttons = [];
      Button.prototype.onlineOnly = true;

      return _.merge(Button.prototype, options);
    };
  }
]);
