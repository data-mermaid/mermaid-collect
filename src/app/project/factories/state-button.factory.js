angular.module('mermaid.libs').factory('StateButton', [
  'Button',
  function(Button) {
    'use strict';

    return function(options) {
      var StateButton = function() {};
      StateButton.prototype = new Button();

      StateButton.prototype.setState = function(state) {
        this.classes = this['class' + state];
        this.name = this['name' + state];
      };

      // Defaults to two states
      StateButton.prototype.type = 'state';
      StateButton.prototype.class1 = 'btn-success';
      StateButton.prototype.class2 = 'btn-completed';
      StateButton.prototype.name2 = '';
      StateButton.prototype.name3 = '';

      return _.merge(StateButton.prototype, options);
    };
  }
]);

angular.module('mermaid.libs').factory('StateGroupButton', [
  'StateButton',
  function(StateButton) {
    'use strict';

    return function(options) {
      var StateGroupButton = function() {};
      StateGroupButton.prototype = new StateButton();

      StateGroupButton.prototype.setState = function(state) {
        this.classes = this['class' + state];
        this.name = this['name' + state];
        _.each(this.buttons, function(btn) {
          btn.classes = btn['class' + state];
          btn.name = btn['name' + state];
        });
      };

      StateGroupButton.prototype.type = 'state-group';
      StateGroupButton.prototype.templateUrl =
        'app/project/factories/state-group-button.tpl.html';

      return _.merge(StateGroupButton.prototype, options);
    };
  }
]);
