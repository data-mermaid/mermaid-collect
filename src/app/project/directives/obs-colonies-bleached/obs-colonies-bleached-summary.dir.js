angular.module('app.project').directive('obsColoniesBleachedSummary', [
  'utils',
  function(utils) {
    'use strict';
    return {
      restrict: 'E',
      scope: {
        obsColoniesBleached: '='
      },
      templateUrl:
        'app/project/directives/obs-colonies-bleached/obs-colonies-bleached-summary.tpl.html',
      link: function(scope) {
        scope.num_colonies = 0;
        scope.num_attributes = 0;
        scope.percent_normal = null;

        const calcSummary = function(obs) {
          let attributes = new Set();
          let total_count_normal = 0;
          let total_count_pale = 0;
          let total_count_20 = 0;
          let total_count_50 = 0;
          let total_count_80 = 0;
          let total_count_100 = 0;
          let total_count_dead = 0;

          _.each(obs, function(ob) {
            const attribute = _.get(ob, 'attribute');
            if (attribute !== null) {
              attributes.add(attribute);
            }

            total_count_normal += _.get(ob, 'count_normal') || 0;
            total_count_pale += _.get(ob, 'count_pale') || 0;
            total_count_20 += _.get(ob, 'count_20') || 0;
            total_count_50 += _.get(ob, 'count_50') || 0;
            total_count_80 += _.get(ob, 'count_80') || 0;
            total_count_100 += _.get(ob, 'count_100') || 0;
            total_count_dead += _.get(ob, 'count_dead') || 0;
          });

          scope.num_colonies =
            total_count_normal +
            total_count_pale +
            total_count_20 +
            total_count_50 +
            total_count_80 +
            total_count_100 +
            total_count_dead;

          scope.percent_normal = utils.safe_multiply(
            utils.safe_division(total_count_normal, scope.num_colonies),
            100
          );

          scope.percent_pale = utils.safe_multiply(
            utils.safe_division(total_count_pale, scope.num_colonies),
            100
          );

          const total_count_bleached =
            total_count_20 +
            total_count_50 +
            total_count_80 +
            total_count_100 +
            total_count_dead;

          scope.percent_bleached = utils.safe_multiply(
            utils.safe_division(total_count_bleached, scope.num_colonies),
            100
          );

          scope.num_attributes = attributes.size;
        };

        scope.$watch(
          'obsColoniesBleached',
          function(obs) {
            obs = obs || [];
            calcSummary(obs);
          },
          true
        );
      }
    };
  }
]);
