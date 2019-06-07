angular.module('mermaid.libs').service('TagService', [
  '$q',
  'offlineservice',
  'Tag',
  function($q, offlineservice, Tag) {
    'use strict';

    let fetchTags = function() {
      return Tag.get().$promise;
    };

    return {
      fetchTags: fetchTags
    };
  }
]);
