angular
  .module('app.project')
  .directive('projectBreadcrumbs', function($state, $compile, $transitions) {
    'use strict';
    return {
      restrict: 'EA',
      replace: true,
      template: '<ol class="breadcrumb"></ol>',
      link: function(scope, element) {
        var compileUrl = function(stateName, params) {
          return $state.href(stateName, params, {
            absolute: true
          });
        };

        function processState(state, stateParams) {
          scope.stateParams = stateParams;
          scope.projectId = $state.params.project_id;
          var projectsUrl = compileUrl('fullapp.projects', stateParams);
          var projectsNameUrl = compileUrl('app.project.records', stateParams);

          var projectsHtml =
            '<li><a href="' + projectsUrl + '">Projects</a></li>';
          var projectNameHtml =
            '<li><a href="' +
            projectsNameUrl +
            '"><projectname watch-id="project-breadcrumb"></projectname></a></li>';

          var html = '';
          var parentStateNames = state.data.parentStates || [];
          _.each(parentStateNames, function(parentStateName) {
            var parentState = $state.get(parentStateName);
            var url = compileUrl(parentStateName, stateParams);
            html +=
              '<li><a href="' +
              url +
              '">' +
              parentState.data.title +
              '</a></li>';
          });
          html += '<li>' + state.data.title + '</li>';

          element.html(projectsHtml);
          element.append($compile(projectNameHtml)(scope)[0]);
          element.append(html);
        }

        processState($state.current, $state.params);

        $transitions.onStart({}, function(transition) {
          var state = transition.to();
          var stateParams = transition.params();
          processState(state, stateParams);
        });
      }
    };
  });
