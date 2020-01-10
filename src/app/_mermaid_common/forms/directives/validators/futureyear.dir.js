angular.module('mermaid.forms').directive('futuredate', function() {
  'use strict';
  return {
    require: 'ngModel',
    link: function(scope, elem, attr, ngModel) {
      var today = new Date().getTime();
      ngModel.validator_messages = ngModel.validator_messages || {};
      ngModel.validator_messages[
        window.appConfig.validatorPrefix + 'futuredate'
      ] = 'Date is in the future';

      function validate() {
        var is_valid = true;
        var dateInput = new Date(ngModel.$modelValue).getTime();
        var dateDifference = Math.floor((today - dateInput) / 86400000);

        if (!isNaN(dateDifference) && dateDifference !== null) {
          is_valid = dateDifference >= 0;
        }
        ngModel.$setValidity(
          window.appConfig.validatorPrefix + 'futuredate',
          is_valid
        );
      }

      scope.$watch(function() {
        return ngModel.$modelValue;
      }, validate);
    }
  };
});
