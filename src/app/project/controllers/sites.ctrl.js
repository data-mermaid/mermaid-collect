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
  'project',
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
    ConnectivityFactory,
    project
  ) {
    'use strict';

    const conn = new ConnectivityFactory($scope);
    $scope.isOnline = connectivity.isOnline;
    this.db = {
      items: null
    };
    this.settings = {
      stretchH: 'all',
      contextMenu: ['row_below', 'remove_row']
    };

    let siteRecordsCount = 0;
    const project_id = $stateParams.project_id;

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
      searchLocation: 'left',
      disableTrackingTableState: true,
      rowFormatter: function(record, element) {
        const isInvalid =
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
          SiteService.downloadSites(project_id);
        },
        copySites: function() {
          const modalOptions = {
            hideHeader: true,
            controller: 'CopySitesCtrl',
            bodyTemplateUrl: 'app/project/partials/copy-sites.tpl.html'
          };
          const modal = ModalService.open(modalOptions);
          modal.result.then(function() {
            $scope.tableControl.refresh();
            project.update();
          });
        },
        clearFilters: function() {
          $scope.tableControl.clearSearch();
        }
      }
    };

    const updateSiteCount = function() {
      $scope.projectObjectsTable.count().then(function(count) {
        siteRecordsCount = count;
      });
    };

    offlineservice.ProjectSitesTable(project_id).then(function(table) {
      $scope.projectObjectsTable = table;
      updateSiteCount();
      $scope.resource = new PaginatedOfflineTableWrapper(table, {
        searchFields: [
          'name',
          '$$reeftypes.name',
          '$$reefzones.name',
          '$$reefexposures.name'
        ]
      });
      $scope.projectObjectsTable.$watch(
        updateSiteCount,
        null,
        'siteRecordsCount'
      );
    });

    const createPopup = function(feature) {
      return !_.isEmpty(feature)
        ? '<a href="#/projects/' +
            feature.project_id +
            '/sites/' +
            feature.id +
            '">' +
            feature.name +
            '</a>' +
            '<div><p>Reef type: <span>' +
            feature.reeftype +
            '</span></p><p>Reef zone: <span>' +
            feature.reefzone +
            '</span></p><p>Exposure: <span>' +
            feature.reefexposure +
            '</span></p></div>'
        : '<p>No content</p>';
    };

    $scope.tableControl.getFilteredRecordsCount = function() {
      const tableRecordsTotal =
        $scope.tableControl.getPaginationTable() &&
        $scope.tableControl.getPaginationTable().total;

      return `${tableRecordsTotal}/${siteRecordsCount}`;
    };

    $scope.tableControl.recordsNotFiltered = function() {
      if (
        $scope.tableControl.records &&
        $scope.tableControl.records.length !== siteRecordsCount
      ) {
        updateSiteCount();
      }
      return !$scope.tableControl.textboxFilterUsed();
    };

    $scope.mapopts = {
      gestureHandling: true,
      project_id: project_id,
      popup: createPopup
    };

    $scope.$on(ValidateDuplicationService.SITE_PAGE, function() {
      $scope.tableControl.refresh(true);
    });

    conn.on('SitesCtrl', function(event) {
      $scope.isOnline = event.event === 'online';
    });

    const newSite = function() {
      $state.go('app.project.sites.site', { id: '' });
    };
  }
]);
