angular
  .module('mermaid.libs')

  .service('ValidationTemplateConfig', [
    function() {
      'use strict';

      return {
        validate_similar: {
          url: 'app/project/partials/validations/similar.tpl.html'
        }
      };
    }
  ]);
