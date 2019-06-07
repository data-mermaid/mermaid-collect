angular.module('mermaid.forms').directive('focusinput', [
  function() {
    'use strict';
    return {
      restrict: 'A',
      link: function(scope, element) {
        var $elem = $(element);
        $elem.focus(function() {
          var footerHeight = 100;
          var isHidden =
            $elem.offset().top - $(window).scrollTop() >
            $(window).height() - footerHeight;

          if (isHidden) {
            $('html, body').animate(
              {
                scrollTop:
                  $elem.offset().top - ($(window).height() - footerHeight)
              },
              500
            );
          }
        });
      }
    };
  }
]);
