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

    var toggleNav = function(state, fromState) {
      const toQry = 'a[data-ui-sref="' + state + '"]';
      const fromQry = 'a[data-ui-sref="' + fromState + '"]';
      const $navItem = $(toQry);
      const $prevNavItem = $(fromQry);
      const $parent = $navItem.closest('ul[data-smart-menu]');
      const $navTree = $navItem.parentsUntil('ul[data-smart-menu]');
      const $prevNavTree = $prevNavItem.parentsUntil('ul[data-smart-menu]');
      //also refers the index of menu collapse item such as Fish Name in Reference site.
      const navTreeLength = $navTree.length - 1;

      const inElemSelection = function(elem, sel2) {
        for (let n = sel2.length; n >= 0; n--) {
          if (elem == sel2[n]) {
            return true;
          }
        }
        return false;
      };

      _.each($parent.find('li[data-menu-collapse]'), function(collapsibleMenu) {
        if (
          $(collapsibleMenu).hasClass('open') &&
          $(collapsibleMenu).find($navItem).length === 0
        ) {
          $(collapsibleMenu).smartCollapseToggle();
          $(collapsibleMenu).removeClass('active');
        }
      });

      for (let i = navTreeLength; i >= 0; i--) {
        if (
          i === navTreeLength &&
          $navTree[i].nodeName === 'LI' &&
          !$($navTree[i]).hasClass('open')
        ) {
          $($navTree[i]).smartCollapseToggle();
        }
      }

      for (let j = 0; j < $prevNavTree.length; j++) {
        const $elem = $($prevNavTree[j]);
        if (
          inElemSelection($elem[0], $navTree) === false &&
          $elem.hasClass('open')
        ) {
          $elem.smartCollapseToggle();
          $elem.removeClass('active');
        }
      }
      activateNavItem(state);
    };

    return {
      activateNavItem: activateNavItem,
      toggleNav: toggleNav
    };
  }
]);
