/**
 * Jarvis Widget Directive
 *
 *    colorbutton="false"
 *    editbutton="false"
      togglebutton="false"
       deletebutton="false"
        fullscreenbutton="false"
        custombutton="false"
        collapsed="true"
          sortable="false"
 *
 *
 */
'use strict';

angular
  .module('SmartAdmin.Layout')
  .directive('jarvisWidget', function($rootScope) {
    return {
      restrict: 'A',
      compile: function(element, attributes) {
        if (element.data('widget-color'))
          element.addClass(
            'jarviswidget-color-' + element.data('widget-color')
          );

        if (!element.data('widget-colorbutton'))
          element.attr('data-widget-colorbutton', 'false');

        if (!element.data('widget-editbutton'))
          element.attr('data-widget-editbutton', 'false');

        if (!element.data('widget-deletebutton'))
          element.attr('data-widget-deletebutton', 'false');

        element
          .find('.widget-body')
          .prepend(
            '<div class="jarviswidget-editbox"><input class="form-control" type="text"></div>'
          );
        element.addClass('jarviswidget');
        $rootScope.$emit('jarvisWidgetAdded', element);
      }
    };
  });
