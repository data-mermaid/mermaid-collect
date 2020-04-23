angular.module('app.project').controller('ManagementsCtrl', [
  '$scope',
  '$state',
  '$stateParams',
  'OfflineTables',
  'ProjectService',
  'ManagementService',
  'PaginatedOfflineTableWrapper',
  'ModalService',
  'ValidateSubmitService',
  'ValidateDuplicationService',
  'project',
  function(
    $scope,
    $state,
    $stateParams,
    OfflineTables,
    ProjectService,
    ManagementService,
    PaginatedOfflineTableWrapper,
    ModalService,
    ValidateSubmitService,
    ValidateDuplicationService,
    project
  ) {
    'use strict';

    let managementRecordsCount = 0;
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
      id: 'management',
      defaultSortByColumn: 'name',
      searching: true,
      searchPlaceholder: 'Filter management regimes by name',
      searchLocation: 'left',
      rowSelect: false,
      hideRowStripes: true,
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
      cols: [
        {
          name: 'name',
          display: 'Name',
          sortable: true,
          tdTemplate:
            '<a ui-sref="app.project.managements.management({project_id: \'' +
            project_id +
            '\', id: record.id})">{{record.name}}</a>'
        },
        { name: 'est_year', display: 'Year Est.', sortable: true },
        {
          name: 'open_access',
          display: 'Open Access',
          sortable: false,
          tdTemplate:
            '<span>' +
            '<i class="fa fa-check" ' +
            'ng-show="record.open_access"/>' +
            '</span>'
        },
        {
          name: 'periodic_closure',
          display: 'Periodic Closure',
          tdTemplate:
            '<span>' +
            '<i class="fa fa-check" ' +
            'ng-show="record.periodic_closure"/>' +
            '</span>'
        },
        {
          name: 'size_limits',
          display: 'Size Limits',
          tdTemplate:
            '<span>' +
            '<i class="fa fa-check" ' +
            'ng-show="record.size_limits"/>' +
            '</span>'
        },
        {
          name: 'gear_restriction',
          display: 'Gear Restrictions',
          tdTemplate:
            '<span>' +
            '<i class="fa fa-check" ' +
            'ng-show="record.gear_restriction"/>' +
            '</span>'
        },
        {
          name: 'species_restriction',
          display: 'Species Restrictions',
          tdTemplate:
            '<span>' +
            '<i class="fa fa-check" ' +
            'ng-show="record.species_restriction"/>' +
            '</span>'
        },
        {
          name: 'no_take',
          display: 'No Take',
          tdTemplate:
            '<span>' +
            '<i class="fa fa-check" ' +
            'ng-show="record.no_take"/>' +
            '</span>'
        }
      ],
      toolbar: {
        template:
          'app/project/partials/custom-toolbars/managements-toolbar.tpl.html',
        newManagement: function() {
          newManagement();
        },
        isDisabled: function() {
          return $scope.isDisabled;
        },
        exportMRs: function() {
          ManagementService.downloadFieldReport(project_id);
        },
        copyManagements: function() {
          const modalOptions = {
            hideHeader: true,
            controller: 'CopyManagementsCtrl',
            bodyTemplateUrl: 'app/project/partials/copy-managements.tpl.html'
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

    const updateManagementCount = function() {
      $scope.projectObjectsTable.count().then(function(count) {
        managementRecordsCount = count;
      });
    };

    OfflineTables.ProjectManagementsTable(project_id).then(function(table) {
      $scope.projectObjectsTable = table;
      updateManagementCount();
      $scope.resource = new PaginatedOfflineTableWrapper(table, {
        searchFields: ['name']
      });
      $scope.projectObjectsTable.$watch(
        updateManagementCount,
        null,
        'managementRecordsCount'
      );
    });

    $scope.tableControl.getFilteredRecordsCount = function() {
      const tableRecordsTotal =
        $scope.tableControl.getPaginationTable() &&
        $scope.tableControl.getPaginationTable().total;

      return `${tableRecordsTotal}/${managementRecordsCount}`;
    };

    $scope.tableControl.recordsNotFiltered = function() {
      if (
        $scope.tableControl.records &&
        $scope.tableControl.records.length !== managementRecordsCount
      ) {
        updateManagementCount();
      }
      return !$scope.tableControl.textboxFilterUsed();
    };

    $scope.$on(ValidateDuplicationService.MR_PAGE, function() {
      $scope.tableControl.refresh(true);
    });

    const newManagement = function() {
      $state.go('app.project.managements.management', { id: '' });
    };
  }
]);
