angular.module('mermaid.libs').service('layoutUtils', [
  function() {
    'use strict';

    var activateNavItem = function(state) {
      var toQry = 'a[data-ui-sref="' + state + '"]';
      var $navItem = $(toQry);
      var $navTree = $navItem.parentsUntil('ul[data-smart-menu]');
      var navTreeLength = $navTree.length - 1; //also refers the index of menu collapse item such as Fish Name in Reference site.

      for (var i = navTreeLength; i >= 0; i--) {
        $($navTree[i]).addClass('active');
      }
    };

    var toggleNav = function(state) {
      var toQry = 'a[data-ui-sref="' + state + '"]';
      var $navItem = $(toQry);
      var $navTree = $navItem.parentsUntil('ul[data-smart-menu]');
      var navTreeLength = $navTree.length - 1; //also refers the index of menu collapse item such as Fish Name in Reference site.

      for (var i = navTreeLength; i >= 0; i--) {
        if (
          i === navTreeLength &&
          $navTree[i].nodeName === 'LI' &&
          !$($navTree[i]).hasClass('open')
        ) {
          $($navTree[i]).smartCollapseToggle();
        }
      }
    };

    return {
      activateNavItem: activateNavItem,
      toggleNav: toggleNav
    };
  }
]);
