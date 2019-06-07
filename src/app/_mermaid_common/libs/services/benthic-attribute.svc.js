angular.module('mermaid.libs').service('BenthicAttributeService', [
  'offlineservice',
  function(offlineservice) {
    'use strict';

    let PROPOSED_RECORD = 10;

    let save = function(benthicAttribute) {
      if (!benthicAttribute.id) {
        benthicAttribute.status = PROPOSED_RECORD;
        return offlineservice.BenthicAttributesTable().then(function(table) {
          return table.create(benthicAttribute);
        });
      }
      return benthicAttribute.update();
    };

    let getBenthicAttribute = function(benthicAttributeId, skipRefresh) {
      return offlineservice
        .BenthicAttributesTable(skipRefresh)
        .then(function(table) {
          return table.get(benthicAttributeId);
        });
    };

    let fetchBenthicAttributes = function(qry, skipRefresh) {
      return offlineservice
        .BenthicAttributesTable(skipRefresh)
        .then(function(table) {
          return table.filter(qry);
        });
    };

    let getCategoryLookup = function(benthicAttributes) {
      var categories = _.filter(benthicAttributes, {
        parent: null
      });
      return _.reduce(
        categories,
        function(obj, category) {
          obj[category.id] = category;
          return obj;
        },
        {}
      );
    };

    return {
      PROPOSED_RECORD: PROPOSED_RECORD,
      fetchBenthicAttributes: fetchBenthicAttributes,
      getBenthicAttribute: getBenthicAttribute,
      getCategoryLookup: getCategoryLookup,
      save: save
    };
  }
]);
