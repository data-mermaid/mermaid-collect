angular.module('app.project').controller('SubmittedTransectMethodsCtrl', [
  'FISH_BELT_TRANSECT_TYPE',
  'BENTHIC_LIT_TRANSECT_TYPE',
  'BENTHIC_PIT_TRANSECT_TYPE',
  'BENTHIC_PQT_TYPE',
  'HABITAT_COMPLEXITY_TRANSECT_TYPE',
  'BLEACHING_QC_QUADRAT_TYPE',
  '$rootScope',
  '$scope',
  '$stateParams',
  '$filter',
  'ProjectService',
  'TransectService',
  'SampleUnitMethod',
  'Button',
  'projectProfile',
  function(
    FISH_BELT_TRANSECT_TYPE,
    BENTHIC_LIT_TRANSECT_TYPE,
    BENTHIC_PIT_TRANSECT_TYPE,
    BENTHIC_PQT_TYPE,
    HABITAT_COMPLEXITY_TRANSECT_TYPE,
    BLEACHING_QC_QUADRAT_TYPE,
    $rootScope,
    $scope,
    $stateParams,
    $filter,
    ProjectService,
    TransectService,
    SampleUnitMethod,
    Button,
    projectProfile
  ) {
    'use strict';

    const METHOD_FILTER_NAME = 'mermaid_submit_method_filter';
    const project_id = $stateParams.project_id;
    const fieldReportButton = new Button();
    let submittedRecordsCount = 0;

    $scope.tableControl = {};
    $scope.choices = {};
    $scope.choices.transect_types = ProjectService.transect_types;
    $scope.tableControl.isDisabled =
      !projectProfile || projectProfile.is_admin !== true;

    const protocolMethods = [
      FISH_BELT_TRANSECT_TYPE,
      BENTHIC_LIT_TRANSECT_TYPE,
      BENTHIC_PIT_TRANSECT_TYPE,
      BENTHIC_PQT_TYPE,
      HABITAT_COMPLEXITY_TRANSECT_TYPE,
      BLEACHING_QC_QUADRAT_TYPE
    ];

    const downloadFieldReport = function(reportProtocol, method) {
      TransectService.downloadFieldReport(project_id, reportProtocol, method);
    };

    const checkLocalStorage = function(item, choices, storageName) {
      const options = JSON.parse(localStorage.getItem(storageName)) || choices;
      if (item === 'all') {
        return options.length === choices.length;
      } else if (options.indexOf(item) !== -1) {
        return true;
      }
      return false;
    };

    $scope.tableConfig = {
      id: 'mermaid_submitted_transects',
      defaultSortByColumn: 'protocol_name',
      searching: true,
      searchPlaceholder:
        'Filter sample units by method, site, management, or observer',
      searchLocation: 'left',
      rowSelect: false,
      hideRowStripes: true,
      filters: {
        project_pk: project_id,
        protocol: (
          JSON.parse(localStorage.getItem(METHOD_FILTER_NAME)) ||
          protocolMethods
        ).join(',')
      },
      cols: [
        {
          name: 'protocol_name',
          display: 'Method',
          sortable: true,
          tdTemplate:
            '<submitted-method-link record="record"></submitted-method-link>'
        },
        {
          name: 'site_name',
          display: 'Site',
          sortable: true,
          sort_by: ['site_name']
        },
        {
          name: 'management_name',
          display: 'Management',
          sortable: true,
          sort_by: ['management_name']
        },
        {
          name: 'sample_unit_number',
          display: 'Sample Unit #',
          sortable: true,
          sort_by: ['sample_unit_number'],
          formatter: function(v) {
            if (v) {
              return v;
            }
            return '-';
          }
        },
        {
          display: 'Size',
          name: 'size_display',
          sortable: true,
          sort_by: ['size_display']
        },
        {
          name: 'depth',
          display: 'Depth (m)',
          sortable: true,
          sort_by: ['sample_unit_method_depth']
        },
        {
          name: 'sample_date',
          display: 'Sample Date',
          sortable: true,
          formatter: function(v) {
            let dateResult = '';
            if (v) {
              const dateVal = v.split('-').map(function(val) {
                return Number(val);
              });
              if (dateVal.length >= 3) {
                const newDateVal = new Date(
                  dateVal[0],
                  dateVal[1] - 1,
                  dateVal[2]
                );
                dateResult = $filter('date')(newDateVal, 'dd-MMM-yyyy');
              }
            }
            return dateResult;
          }
        },
        {
          name: 'observers',
          display: 'Observers',
          sortable: true,
          sort_by: ['observers_display'],
          formatter: function(v) {
            if (v == null) {
              return '-';
            }
            return v.join(', ');
          }
        }
      ],
      toolbar: {
        template:
          'app/project/partials/custom-toolbars/submitted-records-toolbar.tpl.html',
        filterMethod: function(item) {
          const choice = item.choice;
          let options = JSON.parse(
            localStorage.getItem(METHOD_FILTER_NAME)
          ) || [...protocolMethods];
          if (item.selected) {
            options.push(choice);
          } else {
            const index = options.indexOf(choice);
            if (index !== -1) {
              options.splice(index, 1);
            }
          }

          this.allMethods = options.length === protocolMethods.length;
          localStorage.setItem(METHOD_FILTER_NAME, JSON.stringify(options));
          $scope.tableControl.setFilterParam(
            'protocol',
            options.join(','),
            true
          );
          $scope.tableControl.refresh();
        },
        selectAllMethods: function(allSelected) {
          this.allMethods = allSelected;
          const methodTypes = this.methodTypes;
          let options = JSON.parse(
            localStorage.getItem(METHOD_FILTER_NAME)
          ) || [...protocolMethods];
          if (allSelected) {
            methodTypes.forEach(method => {
              if (!method.selected) {
                options.push(method.choice);
              }
              method.selected = true;
            });
          } else {
            methodTypes.forEach(method => (method.selected = false));
            options = [];
          }

          localStorage.setItem(METHOD_FILTER_NAME, JSON.stringify(options));
          $scope.tableControl.setFilterParam(
            'protocol',
            options.join(','),
            true
          );
          $scope.tableControl.refresh();
        },
        clearFilters: function() {
          $scope.tableControl.clearSearch();
        },
        allMethods: checkLocalStorage(
          'all',
          protocolMethods,
          METHOD_FILTER_NAME
        ),
        methodTypes: [
          {
            name: 'Fish Belt',
            choice: protocolMethods[0],
            selected: checkLocalStorage(
              protocolMethods[0],
              protocolMethods,
              METHOD_FILTER_NAME
            )
          },
          {
            name: 'Benthic LIT',
            choice: protocolMethods[1],
            selected: checkLocalStorage(
              protocolMethods[1],
              protocolMethods,
              METHOD_FILTER_NAME
            )
          },
          {
            name: 'Benthic PIT',
            choice: protocolMethods[2],
            selected: checkLocalStorage(
              protocolMethods[2],
              protocolMethods,
              METHOD_FILTER_NAME
            )
          },
          {
            name: 'Bleaching',
            choice: protocolMethods[4],
            selected: checkLocalStorage(
              protocolMethods[4],
              protocolMethods,
              METHOD_FILTER_NAME
            )
          },
          {
            name: 'Habitat Complexity',
            choice: protocolMethods[3],
            selected: checkLocalStorage(
              protocolMethods[3],
              protocolMethods,
              METHOD_FILTER_NAME
            )
          }
        ]
      }
    };
    $scope.resource = SampleUnitMethod;
    $scope.resource
      .query({
        project_pk: project_id,
        limit: 0,
        protocol: $scope.choices.transect_types
          .map(function(tt) {
            return tt.id;
          })
          .join(',')
      })
      .$promise.then(function(val) {
        submittedRecordsCount = val.count;
      });
    $scope.tableControl.getFilteredRecordsCount = function() {
      const tableRecordsTotal =
        $scope.tableControl.getPaginationTable() &&
        $scope.tableControl.getPaginationTable().total;
      return `${tableRecordsTotal}/${submittedRecordsCount}`;
    };

    $scope.tableControl.noAppliedFilters = function() {
      const searchBoxNotUsed = !$scope.tableControl.textboxFilterUsed();
      const methodStorage = checkLocalStorage(
        'all',
        protocolMethods,
        METHOD_FILTER_NAME
      );
      return searchBoxNotUsed && methodStorage;
    };

    const buttons = [];
    const transectReports = [];

    _.each($scope.choices.transect_types, function(transect) {
      if (transect.name === 'Bleaching') {
        for (let i = 0; i < transect.reportNames.length; i++) {
          const bleaching = {};
          bleaching.name = transect.reportNames[i];
          bleaching.method = transect.methods[i];
          bleaching.reportProtocol = transect.reportProtocol;

          transectReports.push(bleaching);
        }
      } else {
        const otherTransects = {};
        otherTransects.name = transect.name;
        otherTransects.method = transect.method;
        otherTransects.reportProtocol = transect.reportProtocol;

        transectReports.push(otherTransects);
      }
    });

    _.each(transectReports, function(transectReport) {
      const btn = new Button();
      btn.name = transectReport.name;
      btn.onlineOnly = true;
      btn.enabled = true;
      btn.click = function() {
        downloadFieldReport(
          transectReport.reportProtocol,
          transectReport.method
        );
      };
      buttons.push(btn);
    });

    fieldReportButton.name = 'Export to CSV';
    fieldReportButton.classes = 'btn-success';
    fieldReportButton.icon = 'fa fa-download';
    fieldReportButton.onlineOnly = true;
    fieldReportButton.visible = true;
    fieldReportButton.enabled = true;
    fieldReportButton.buttons = buttons;

    $rootScope.PageHeaderButtons = [fieldReportButton];
  }
]);
