angular.module('app.project').directive('validationWizardPage', [
  '$q',
  '$compile',
  '$templateRequest',
  'utils',
  function($q, $compile, $templateRequest, utils) {
    'use strict';
    return {
      restrict: 'AE',
      scope: {
        record: '=',
        config: '='
      },
      link: function(scope, element) {
        scope.validationWizardForm = scope.$parent.validationWizardForm;

        var loadPage = function(config) {
          config = config || {};
          var promises = [];
          var resolve = config.resolve || {};
          if (config.templateUrl) {
            promises.push($templateRequest(config.templateUrl));
          } else {
            promises.push($q.resolve('<div></div>'));
          }

          promises = promises.concat(
            _.map(resolve, function(func, key) {
              func = utils.funcify(func, $q.resolve(func));
              return func(scope.record).then(function(val) {
                var o = {};
                o[key] = val;
                return o;
              });
            })
          );

          $q.all(promises).then(function(responses) {
            var html = responses[0];
            var template = angular.element(html);
            element.html(template);

            for (var i = 1; i < responses.length; i++) {
              var key = _.keys(responses[i])[0];
              var val = _.values(responses[i])[0];
              scope[key] = val;
            }
            $compile(template)(scope);
          });
        };

        scope.$watch(
          'config',
          function() {
            loadPage(scope.config);
          },
          true
        );
      }
    };
  }
]);
