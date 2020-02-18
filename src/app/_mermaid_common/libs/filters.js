'use strict';

angular
  .module('mermaid.libs')

  .filter('reverse', function() {
    return function(items) {
      return items.slice().reverse();
    };
  })

  .filter('null_value', function() {
    return function(v) {
      if (
        v === null ||
        v === undefined ||
        _.isNaN(v) ||
        (_.isString(v) && v.length === 0)
      ) {
        return '-';
      }
      return v;
    };
  })

  .filter('percentage', function($filter) {
    return function(input, decimals) {
      var value = $filter('number')(input * 100, decimals);
      return value ? value + '%' : value;
    };
  })

  .filter('matchchoice', function() {
    return function(val, choices, displayAttr, message) {
      let _choices;
      if (_.isFunction(choices)) {
        _choices = choices();
      } else {
        _choices = choices;
      }
      var rec = _.find(_choices, function(o) {
        return o.id == val;
      });
      var res = null;
      if (rec) {
        if (displayAttr != null) {
          res = _.get(rec, displayAttr);
        } else {
          res = rec.name || rec.label;
        }
      } else if (val != null) {
        res = message;
      }
      return res;
    };
  })

  .filter('validators', function() {
    return function(error_obj) {
      if (
        !_.isUndefined(error_obj) &&
        Object.keys(error_obj).length > 0 &&
        Object.keys(error_obj)[0].startsWith(appConfig.validatorPrefix)
      ) {
        return error_obj;
      }
      return;
    };
  })

  .filter('null_blank', function() {
    return function(v) {
      if (v === null || v === undefined || (_.isString(v) && v.length === 0)) {
        return '[blank]';
      }
      return v;
    };
  })

  .filter('typeaheadHighLight', function() {
    function indexOfHighLightChars(lettersMarch, lettersQry) {
      var highLightIndexArr = [];
      var counter = 0;

      function getAllIndexes(arr, val) {
        var indexes = [];
        for (let i = 0; i < arr.length; i++) {
          if (arr[i] === val) {
            indexes.push(i);
          }
        }
        return indexes;
      }

      lettersQry.forEach(function(letter) {
        var indexesOfLetter = getAllIndexes(lettersMarch, letter);
        for (let i = 0; i < indexesOfLetter.length; i++) {
          if (counter <= indexesOfLetter[i]) {
            counter = indexesOfLetter[i];
            highLightIndexArr.push(indexesOfLetter[i]);
            break;
          }
        }
      });

      return highLightIndexArr;
    }

    return function(matchItem, query) {
      var letters = query.split('');
      var regex_exp = new RegExp(letters.join('|'), 'i');
      var matchItems = matchItem.split('');
      var matchLettersLowerCase = matchItem.toLowerCase().split('');

      var marchHighlights = _.map(matchItems, function(letter, index) {
        if (
          _.includes(
            indexOfHighLightChars(matchLettersLowerCase, letters),
            index
          )
        ) {
          return letter.replace(regex_exp, '<strong>$&</strong>');
        }
        return letter;
      });

      var result = marchHighlights.join('');

      return result;
    };
  });
