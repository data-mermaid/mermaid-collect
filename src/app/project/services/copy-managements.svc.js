angular.module('app.project').service('CopyManagementsService', [
  'Management',
  function(Management) {
    'use strict';

    var service = {
      projectId: null,
      control: {},
      resource: Management,
      choices: {},
      config: {
        id: 'select_managements',
        defaultSortByColumn: 'name',
        selecting: true,
        selectingTableName: 'Management Regimes',
        searching: true,
        searchLocation: 'right',
        searchPlaceholder: 'Filter by name, secondary name, project or year',
        rowSelect: true,
        filters: { include_fields: 'project_name' },
        disableTrackingTableState: true,
        hideLimits: true,
        pagination: { limit: 5 },
        cols: [
          { name: 'name', display: 'Name', sortable: true },
          { name: 'est_year', display: 'Year Est.', sortable: true },
          {
            name: 'open_access',
            display: 'Open Access',
            sortable: true,
            tdTemplate:
              '<span>' +
              '<i class="fa fa-check" ' +
              'ng-show="record.open_access"/>' +
              '</span>'
          },
          {
            name: 'periodic_closure',
            display: 'Periodic Closure',
            sortable: true,
            tdTemplate:
              '<span>' +
              '<i class="fa fa-check" ' +
              'ng-show="record.periodic_closure"/>' +
              '</span>'
          },
          {
            name: 'size_limits',
            display: 'Size Limits',
            sortable: true,
            tdTemplate:
              '<span>' +
              '<i class="fa fa-check" ' +
              'ng-show="record.size_limits"/>' +
              '</span>'
          },
          {
            name: 'gear_restriction',
            display: 'Gear Restrictions',
            sortable: true,
            tdTemplate:
              '<span>' +
              '<i class="fa fa-check" ' +
              'ng-show="record.gear_restriction"/>' +
              '</span>'
          },
          {
            name: 'species_restriction',
            display: 'Species Restrictions',
            sortable: true,
            tdTemplate:
              '<span>' +
              '<i class="fa fa-check" ' +
              'ng-show="record.species_restriction"/>' +
              '</span>'
          },
          {
            name: 'no_take',
            display: 'No Take',
            sortable: true,
            tdTemplate:
              '<span>' +
              '<i class="fa fa-check" ' +
              'ng-show="record.no_take"/>' +
              '</span>'
          }
        ],
        toolbar: {
          template:
            'app/project/partials/custom-toolbars/copy-records-toolbar.tpl.html',
          tableOptions: { viewSelectedOnly: true },
          viewSelectedOnly: false
        },
        watchers: []
      }
    };
    return service;
  }
]);
