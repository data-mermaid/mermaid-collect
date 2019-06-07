angular.module('app.project').controller('SitesCtrl', [
  '$scope',
  '$state',
  '$stateParams',
  'offlineservice',
  'ProjectService',
  'SiteService',
  'PaginatedOfflineTableWrapper',
  'ModalService',
  'ValidateSubmitService',
  'ValidateDuplicationService',
  'connectivity',
  'ConnectivityFactory',
  function(
    $scope,
    $state,
    $stateParams,
    offlineservice,
    ProjectService,
    SiteService,
    PaginatedOfflineTableWrapper,
    ModalService,
    ValidateSubmitService,
    ValidateDuplicationService,
    connectivity,
    ConnectivityFactory
  ) {
    'use strict';

    var conn = new ConnectivityFactory($scope);
    $scope.isOnline = connectivity.isOnline;

    this.db = {
      items: null
    };
    this.settings = {
      stretchH: 'all',
      contextMenu: ['row_below', 'remove_row']
    };

    var project_id = $stateParams.project_id;

    $scope.isDisabled = true;
    ProjectService.getMyProjectProfile(project_id).then(function(
      projectProfile
    ) {
      $scope.isDisabled =
        !projectProfile ||
        (projectProfile.is_admin !== true &&
          projectProfile.is_collector !== true);
    });

    $scope.resource = undefined;
    $scope.tableControl = {};
    $scope.tableConfig = {
      id: 'sites',
      defaultSortByColumn: 'name',
      searching: true,
      searchPlaceholder: 'Filter sites by name, reef (type, zone, or exposure)',
      searchIcon: 'fa-filter',
      searchLocation: 'right',
      disableTrackingTableState: false,
      rowFormatter: function(record, element) {
        var isInvalid =
          _.get(
            record,
            'validations.results._root_.validate_similar.status'
          ) === ValidateSubmitService.WARN_VALIDATION_STATUS;

        if (isInvalid) {
          element.addClass(
            ValidateSubmitService.transectStatusCssClass(record)
          );
        }
      },
      rowSelect: false,
      hideRowStripes: true,
      cols: [
        {
          name: 'name',
          display: 'Name',
          sortable: true,
          tdTemplate:
            '<a ui-sref="app.project.sites.site({project_id: \'' +
            project_id +
            '\', id: record.id})">{{record.name}}</a>'
        },
        {
          name: 'reef_type',
          display: 'Reef Type',
          sortable: true,
          sort_by: ['$$reeftypes.name'],
          formatter: function(v, record) {
            return record.$$reeftypes.name;
          }
        },
        {
          name: 'reef_zone',
          display: 'Reef Zone',
          sortable: true,
          sort_by: ['$$reefzones.name'],
          formatter: function(v, record) {
            return record.$$reefzones.name;
          }
        },
        {
          name: 'exposure',
          display: 'Exposure',
          sortable: true,
          sort_by: ['$$reefexposures.name'],
          formatter: function(v, record) {
            return record.$$reefexposures.name;
          }
        }
      ],
      toolbar: {
        template: 'app/project/partials/custom-toolbars/sites-toolbar.tpl.html',
        isDisabled: function() {
          return $scope.isDisabled;
        },
        newSite: function() {
          newSite();
        },
        exportSites: function() {
          SiteService.downloadFieldReport(project_id);
        },
        copySites: function() {
          var modal;
          var modalOptions = {
            hideHeader: true,
            controller: 'CopySitesCtrl',
            bodyTemplateUrl: 'app/project/partials/copy-sites.tpl.html'
          };
          modal = ModalService.open(modalOptions);
          modal.result.then(function() {
            $scope.tableControl.refresh();
          });
        }
      }
    };

    offlineservice.ProjectSitesTable(project_id).then(function(table) {
      $scope.projectObjectsTable = table;
      $scope.resource = new PaginatedOfflineTableWrapper(table, {
        searchFields: [
          'name',
          '$$reeftypes.name',
          '$$reefzones.name',
          '$$reefexposures.name'
        ]
      });
    });

    $scope.mapopts = {
      gestureHandling: true
    };
    $scope.$on(ValidateDuplicationService.SITE_PAGE, function() {
      $scope.tableControl.refresh(true);
    });

    conn.on('SitesCtrl', function(event) {
      $scope.isOnline = event.event === 'online';
    });

    var newSite = function() {
      $state.go('app.project.sites.site', { id: '' });
    };
  }
]);
