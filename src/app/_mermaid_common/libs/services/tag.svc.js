angular.module('mermaid.libs').service('TagService', [
  '$q',
  'OfflineTableUtils',
  'Tag',
  function($q, OfflineTableUtils, Tag) {
    'use strict';

    let fetchTags = function() {
      return Tag.get().$promise;
    };

    return {
      fetchTags: fetchTags
    };
  }
]);
