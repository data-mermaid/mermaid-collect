/*
  icon: Button icon css class, already includes `fa` class
  classes: Button css class, already includes `btn` class
  tab-index: Tab index
  is-disabled: ng-disabled
  click: Function to execute when button is clicked
 */

angular.module('mermaid.libs').directive('btn', [
  function() {
    'use strict';
    return {
      restrict: 'E',
      transclude: true,
      scope: {
        icon: '@', // example: fa-times
        classes: '@', // example: btn-sm btn-primary
        click: '&',
        tabIndex: '@',
        isDisabled: '=?'
      },
      template:
        '<button ' +
        '  type="button" ' +
        '  ng-disabled="isDisabled" ' +
        '  class="btn {{classes || \'\'}}" ' +
        '  tabIndex="{{tabIndex || -1}}" ' +
        '  ng-click="click()"' +
        "  ng-class=\"{false: '', true: 'disabled'}[isDisabled]\" " +
        '>' +
        '<i ng-show="icon" class="fa {{icon || \'\'}}"></i>' +
        '<ng-transclude></ng-transclude>' +
        '</button>'
    };
  }
]);
