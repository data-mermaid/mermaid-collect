angular.module('mermaid.libs').service('layoutUtils', [
  function() {
    'use strict';

    var activateNavItem = function(state) {
      const toQry = 'a[data-ui-sref="' + state + '"]';
      const $navItem = $(toQry);
      const $navTree = $navItem.parentsUntil('ul[data-smart-menu]');
      const navTreeLength = $navTree.length - 1; //also refers the index of menu collapse item such as Fish Name in Reference site.

      for (let i = navTreeLength; i >= 0; i--) {
        $($navTree[i]).addClass('active');
      }
    };

    var toggleNav = function(state) {
      const toQry = 'a[data-ui-sref="' + state + '"]';
      const $navItem = $(toQry);
      const $parent = $navItem.closest('ul[data-smart-menu]');

      _.each($parent.find('li[data-menu-collapse]'), function(collapsibleMenu) {
        if (
          $(collapsibleMenu).hasClass('open') &&
          $(collapsibleMenu).find($navItem).length === 0
        ) {
          $(collapsibleMenu).smartCollapseToggle();
          $(collapsibleMenu).removeClass('active');
        }
      });

      $parent
        .find('li.open')
        .not($navItem)
        .not($navItem.closest('li[data-menu-collapse]'))
        .removeClass('open');

      activateNavItem(state);

      $navItem
        .closest('li[data-menu-collapse]')
        .not('.open')
        .smartCollapseToggle();
    };

    return {
      activateNavItem: activateNavItem,
      toggleNav: toggleNav
    };
  }
]);
