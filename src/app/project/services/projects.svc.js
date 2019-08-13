angular.module('app.project').service('ProjectsService', [
  'ModalService',
  'offlineservice',
  function(ModalService, offlineservice) {
    'use strict';

    const showOrphanedProjectsModal = function() {
      const modalOptions = {
        hideHeader: true,
        controller: 'OrphanedProjectsCtrl',
        bodyTemplateUrl: 'app/project/partials/orphaned-projects.tpl.html'
      };

      return offlineservice
        .getOrphanedProjects()
        .then(function(orphanedProjects) {
          if (orphanedProjects && orphanedProjects.length > 0) {
            modalOptions.orphanedProjects = orphanedProjects;

            const projectIds = _.map(orphanedProjects, 'projectId');
            modalOptions.resolve = {
              orphanedProjects: function(offlineservice) {
                return offlineservice
                  .ProjectsTable()
                  .then(function(table) {
                    return table.filter({
                      id: function(val) {
                        return projectIds.indexOf(val);
                      }
                    });
                  })
                  .then(function(records) {
                    return _.reduce(
                      records,
                      function(o, record) {
                        o[record.id] = record.name;
                        return o;
                      },
                      {}
                    );
                  })
                  .then(function(projectNames) {
                    return _.map(orphanedProjects, function(orphanedProject) {
                      orphanedProject.name =
                        projectNames[orphanedProject.projectId];
                      return orphanedProject;
                    });
                  });
              }
            };
            return ModalService.open(modalOptions);
          }
          return null;
        });
    };

    return {
      showOrphanedProjectsModal: showOrphanedProjectsModal
    };
  }
]);
