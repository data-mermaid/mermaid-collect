angular.module('app.project').directive('projectTags', [
  'utils',
  '$filter',
  'ModalService',
  function(utils, $filter, ModalService) {
    'use strict';
    return {
      restrict: 'EA',
      require: '^form',

      scope: {
        tags: '=',
        organization: '=',
        tagChoices: '=?',
        isDisabled: '=?'
      },
      templateUrl: 'app/project/directives/project-tags.tpl.html',
      link: function(scope, element, attrs, formCtrl) {
        var modal;
        var success_message = {
          title: 'Suggestion submitted',
          info: 'Your organization tag will be reviewed by the MERMAID team.'
        };
        var error_message = {
          title: 'Suggestion failed',
          info: 'Your organization tag is already added! Input search again.'
        };
        var warning_message = {
          title: 'Found Tag',
          info: 'Your organization tag is already added below.'
        };

        var checkExistingTag = function(tname) {
          var foundId = _.findKey(scope.tags, function(tag) {
            return tag === tname;
          });
          return foundId;
        };

        scope.modalConfig = {
          bodyTemplateUrl:
            'app/_mermaid_common/libs/partials/organizationtag-input-new.tpl.html',
          controller: 'OrganizationTagModalCtrl'
        };

        scope.modalTrigger = function() {
          modal = ModalService.open(scope.modalConfig);
          modal.result.then(function(record) {
            addTagFromModal(record);
            scope.tagChoices.push(record);
            formCtrl.tag.$setViewValue('');
          });
        };

        scope.removeTag = function(tag) {
          _.pull(scope.tags, tag);
          formCtrl.$setDirty();
        };

        var addTagFromModal = function(tag) {
          var tagInput = tag.toLowerCase();
          var tagChoicesTable = _.map(scope.tagChoices, function(tag) {
            if (_.isUndefined(tag.name)) {
              return tag;
            } else {
              return tag.name.toLowerCase();
            }
          });
          var projectTags = _.map(scope.tags, function(tag) {
            return tag.toLowerCase();
          });

          if (_.indexOf(tagChoicesTable, tagInput) === -1) {
            scope.tags.push(tag);
            formCtrl.$setDirty();
            utils.showAlert(
              success_message.title,
              success_message.info,
              utils.statuses.success
            );
          } else if (_.indexOf(projectTags, tagInput) !== -1) {
            utils.showAlert(
              warning_message.title,
              warning_message.info,
              utils.statuses.warning
            );
          } else {
            utils.showAlert(
              error_message.title,
              error_message.info,
              utils.statuses.error
            );
          }
        };

        scope.addTag = function(tag) {
          var tagName = $filter('matchchoice')(tag, scope.tagChoices);
          if (!checkExistingTag(tagName)) {
            scope.tags.push(tagName);
            formCtrl.$setDirty();
            formCtrl.tag.$setViewValue('');
          }
        };
        scope.getTags = function() {
          return scope.tagChoices;
        };
      }
    };
  }
]);
