angular.module('mermaid.libs').directive('adminOnly', [
  '$stateParams',
  'ProjectService',
  'connectivity',
  'ConnectivityFactory',
  function($stateParams, ProjectService, connectivity, ConnectivityFactory) {
    'use strict';
    return {
      restrict: 'A',
      link: function(scope, element) {
        const conn = new ConnectivityFactory(scope);
        const project_id = $stateParams.project_id || null;
        const $elem = $(element);
        let refreshLoad = connectivity.isOnline;
        let isAdmin = null;
        $elem.hide();

        function showElem(display) {
          if (display && connectivity.isOnline) {
            $elem.show();
          } else {
            $elem.hide();
          }
        }

        function setVisibility(project_id) {
          if (refreshLoad) {
            if (!isAdmin) {
              ProjectService.getMyProjectProfile(project_id)
                .then(function(project_profile) {
                  isAdmin = project_profile && project_profile.is_admin;
                  if (isAdmin) {
                    showElem(true);
                  } else {
                    showElem(false);
                  }
                })
                .catch(function() {
                  showElem(false);
                });
            } else {
              showElem(true);
            }
            refreshLoad = false;
          }
        }
        setVisibility(project_id);

        conn.on(project_id + '-adminOnly', function(event) {
          const isOffline = event.event === 'offline';

          if (isOffline) {
            showElem(false);
            refreshLoad = true;
          } else {
            setVisibility(project_id);
          }
        });
      }
    };
  }
]);
