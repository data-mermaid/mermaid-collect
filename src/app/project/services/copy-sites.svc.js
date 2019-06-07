angular.module('app.project').service('CopySitesService', [
  'Site',
  function(Site) {
    'use strict';

    var service = {
      projectId: null,
      control: {},
      resource: Site,
      choices: {},
      config: {
        id: 'select_sites',
        defaultSortByColumn: 'name',
        selecting: true,
        selectingTableName: 'Sites',
        searching: true,
        searchIcon: 'fa-filter',
        searchLocation: 'right',
        searchPlaceholder: 'Filter by name, project or country',
        rowSelect: true,
        filters: {
          include_fields:
            'country_name,project_name,reef_type_name,reef_zone_name,exposure_name'
        },
        disableTrackingTableState: true,
        hideLimits: true,
        pagination: { limit: 5 },
        cols: [
          { name: 'name', display: 'Name', sortable: true },
          {
            name: 'project_name',
            sort_by: ['project__name'],
            display: 'Project',
            sortable: true
          },
          {
            name: 'country_name',
            sort_by: ['country__name'],
            display: 'Country',
            sortable: true
          },
          {
            name: 'reef_type_name',
            sort_by: ['reef_type__name'],
            display: 'Reef Type',
            sortable: true
          },
          {
            name: 'reef_zone_name',
            sort_by: ['reef_zone__name'],
            display: 'Reef Zone',
            sortable: true
          },
          {
            name: 'exposure_name',
            sort_by: ['exposure__name'],
            display: 'Exposure',
            sortable: true
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
