angular.module('mermaid.libs').directive('adminOnly', [
  '$stateParams',
  'ProjectService',
  'utils',
  'connectivity',
  'ConnectivityFactory',
  function(
    $stateParams,
    ProjectService,
    utils,
    connectivity,
    ConnectivityFactory
  ) {
    'use strict';
    return {
      restrict: 'A',
      scope: {
        adminOnlineOnly: '=?'
      },
      link: function(scope, element) {
        var conn = new ConnectivityFactory(scope);
        var onlineOnly = utils.truthy(scope.adminOnlineOnly);
        var project_id = $stateParams.project_id || null;
        var $elem = $(element);
        $elem.hide();

        function showElem(display) {
          if (display && onlineOnly && connectivity.isOnline) {
            $elem.show();
          } else if (display && onlineOnly !== true) {
            $elem.show();
          } else {
            $elem.hide();
          }
        }

        function setVisibility(project_id) {
          ProjectService.getMyProjectProfile(project_id)
            .then(function(project_profile) {
              if (project_profile && project_profile.is_admin) {
                showElem(true);
              } else {
                showElem(false);
              }
            })
            .catch(function() {
              showElem(false);
            });
        }
        setVisibility(project_id);

        conn.on(project_id + '-adminOnly', function() {
          setVisibility(project_id);
        });
      }
    };
  }
]);
