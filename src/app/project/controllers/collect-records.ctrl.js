angular.module('app.project').controller('CollectRecordsCtrl', [
  '$state',
  '$stateParams',
  '$q',
  '$rootScope',
  '$filter',
  '$scope',
  'utils',
  'Button',
  'authService',
  'OfflineTables',
  'PaginatedOfflineTableWrapper',
  'ProjectService',
  'ValidateSubmitService',
  'projectProfile',
  'beltTransectWidthChoices',
  function(
    $state,
    $stateParams,
    $q,
    $rootScope,
    $filter,
    $scope,
    utils,
    Button,
    authService,
    OfflineTables,
    PaginatedOfflineTableWrapper,
    ProjectService,
    ValidateSubmitService,
    projectProfile,
    beltTransectWidthChoices
  ) {
    'use strict';

    let collectRecordsTable = {};
    let collectRecordsCount = 0;
    const addTransectGroupButton = new Button();
    const METHOD_FILTER_NAME = 'mermaid_collect_method_filter';
    const STATUS_FILTER_NAME = 'mermaid_collect_status_filter';
    const project_id = $stateParams.project_id;
    const promises = [
      authService.getCurrentUser(),
      OfflineTables.CollectRecordsTable(project_id)
    ];

    $scope.choices = {};
    $scope.tableControl = {};
    $scope.submission_outcome = {};
    $scope.config = null;
    $scope.userRecords = true;
    $scope.choices.transect_types = ProjectService.transect_types;
    $scope.isDisabled =
      !projectProfile ||
      (projectProfile.is_admin !== true &&
        projectProfile.is_collector !== true);
    $scope.tableControl.isDisabled = $scope.isDisabled;

    const protocolMethods = [
      ProjectService.FISH_BELT_TRANSECT_TYPE,
      ProjectService.BENTHIC_LIT_TRANSECT_TYPE,
      ProjectService.BENTHIC_PIT_TRANSECT_TYPE,
      ProjectService.HABITAT_COMPLEXITY_TRANSECT_TYPE,
      ProjectService.BLEACHING_QC_QUADRAT_TYPE
    ];
    const statusChoices = [null, 'ok', 'warning', 'error'];

    const checkLocalStorage = function(item, choices, storageName) {
      const options = JSON.parse(localStorage.getItem(storageName)) || choices;
      if (item === 'all') {
        return options.length === choices.length;
      } else if (options.indexOf(item) !== -1) {
        return true;
      }
      return false;
    };

    const sizeFormat = function(value) {
      let result = '-';
      const protocol = value.protocol;
      if (protocol === ProjectService.FISH_BELT_TRANSECT_TYPE) {
        const width = _.get(value, 'fishbelt_transect.width');
        const widthFilter = $filter('matchchoice')(
          width,
          beltTransectWidthChoices
        );
        const length = _.get(value, 'fishbelt_transect.len_surveyed');

        if (length && width && widthFilter) {
          result = length + 'm x ' + widthFilter.slice(0, -1) + 'm';
        } else if (length || width) {
          result = length ? length : widthFilter.slice(0, -1);
        }
        return result;
      } else if (protocol === ProjectService.BLEACHING_QC_QUADRAT_TYPE) {
        result = _.get(value, 'quadrat_collection.quadrat_size') || '-';
        return result + 'm<sup>2</sup>';
      }
      result = _.get(value, 'benthic_transect.len_surveyed') || result;
      return result + 'm';
    };

    $scope.tableControl.choices = $scope.choices;
    $scope.tableConfig = {
      id: 'mermaid_collect_records',
      hideRowStripes: true,
      searching: true,
      searchPlaceholder:
        'Filter sample units by method, site, management, or observer',
      searchLocation: 'left',
      defaultSortByColumn: 'data.protocol',
      rowFormatter: function(record, element) {
        element.addClass(ValidateSubmitService.transectStatusCssClass(record));
      },
      filters: {
        profile: projectProfile.profile,
        'data.protocol': function(val) {
          const options =
            JSON.parse(localStorage.getItem(METHOD_FILTER_NAME)) ||
            protocolMethods;
          return options.indexOf(val) !== -1;
        },
        validations: function(val) {
          const options =
            JSON.parse(localStorage.getItem(STATUS_FILTER_NAME)) ||
            statusChoices;
          if (val === undefined) {
            return options.indexOf(null) !== -1;
          }
          if (val === null) {
            return options.indexOf(val) !== -1;
          }
          return options.indexOf(_.get(val, 'status')) !== -1;
        }
      },
      rowSelect: false,
      cols: [
        {
          name: 'data.protocol',
          display: 'Method',
          sortable: true,
          choices: $scope.choices.transect_types,
          tdTemplate:
            '<a href="/#/projects/' +
            project_id +
            '/collect/{{record.data.protocol}}/{{record.id}}">' +
            '{{record.data.protocol | ' +
            'matchchoice: control.choices.transect_types }}</a>'
        },
        {
          name: 'data.sample_event.site',
          display: 'Site',
          sortable: true,
          sort_by: ['$$sites.name'],
          formatter: function(v, record) {
            return record.$$sites.name;
          }
        },
        {
          name: 'data.sample_event.management',
          display: 'Management',
          sortable: true,
          sort_by: ['$$managements.name'],
          formatter: function(v, record) {
            return record.$$managements.name;
          }
        },
        {
          name: 'data',
          display: 'Sample Unit #',
          sortable: true,
          sort_by: ['transect_number'],
          formatter: function(v) {
            let val,
              label_val = '';
            let protocol = v.protocol;
            if (protocol === ProjectService.FISH_BELT_TRANSECT_TYPE) {
              val = _.get(v, 'fishbelt_transect.number', '') || '';
              label_val = _.get(v, 'fishbelt_transect.label', '') || '';
            } else if (
              protocol === ProjectService.BENTHIC_LIT_TRANSECT_TYPE ||
              protocol === ProjectService.BENTHIC_PIT_TRANSECT_TYPE ||
              protocol === ProjectService.HABITAT_COMPLEXITY_TRANSECT_TYPE
            ) {
              val = _.get(v, 'benthic_transect.number', '') || '';
              label_val = _.get(v, 'benthic_transect.label', '') || '';
            }
            if (val === '') {
              val = label_val;
            } else if (label_val !== '') {
              val += ' ' + label_val;
            }
            return val;
          }
        },
        {
          name: 'data',
          display: 'Size',
          sortable: true,
          sort_by: ['transect_length'],
          formatter: function(v) {
            return sizeFormat(v);
          }
        },
        {
          name: 'data.sample_event.depth',
          display: 'Depth (m)',
          sortable: true
        },
        {
          name: 'data.sample_event.sample_date',
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
          name: 'data.observers',
          display: 'Observers',
          sortable: false,
          formatter: function(v) {
            let observers = [];
            angular.forEach(v, function(observer) {
              observers.push(observer.profile_name);
            });
            return observers.join(', ') || '-';
          }
        },
        {
          name: 'data.submission_results.status',
          display: 'Status',
          sortable: false,
          formatter: function(v, record) {
            // TODO: Status options should be added choices api
            // so they can be translated.
            return ValidateSubmitService.transectStatusLabel(record);
          }
        },
        {
          name: '$$synced',
          display: 'Synced',
          sortable: false,
          tdTemplate:
            '<span>' +
            '<i class="fa fa-refresh status-icon" ' +
            "ng-class=\"{true: 'active', false: ''}[record.$$synced]\"/>" +
            '</span>'
        }
      ],
      toolbar: {
        template:
          'app/project/partials/custom-toolbars/collect-record-toolbar.tpl.html',
        allMethods: checkLocalStorage(
          'all',
          protocolMethods,
          METHOD_FILTER_NAME
        ),
        allStatus: checkLocalStorage('all', statusChoices, STATUS_FILTER_NAME),
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
        ],
        statusTypes: [
          {
            name: 'Saved',
            choice: statusChoices[0],
            selected: checkLocalStorage(
              statusChoices[0],
              statusChoices,
              STATUS_FILTER_NAME
            )
          },
          {
            name: 'Validated',
            choice: statusChoices[1],
            selected: checkLocalStorage(
              statusChoices[1],
              statusChoices,
              STATUS_FILTER_NAME
            )
          },
          {
            name: 'Warnings',
            choice: statusChoices[2],
            selected: checkLocalStorage(
              statusChoices[2],
              statusChoices,
              STATUS_FILTER_NAME
            )
          },
          {
            name: 'Errors',
            choice: statusChoices[3],
            selected: checkLocalStorage(
              statusChoices[3],
              statusChoices,
              STATUS_FILTER_NAME
            )
          }
        ],
        deleteSelected: function() {
          const records = $scope.tableControl.getSelectedRecords();
          if (_.isArray(records) === false || records.length === 0) {
            return;
          }
          const args = utils.templateArgs(records);
          utils.showConfirmation(
            function() {
              $scope.tableControl.deleteRecords(records);
              angular.forEach(records, function(rec) {
                rec.delete();
              });
            },
            'Warning',
            utils.template(utils.messages.deleteRecordWarning, args)
          );
        },
        filterMethod: function(item) {
          let options = JSON.parse(
            localStorage.getItem(METHOD_FILTER_NAME)
          ) || [...protocolMethods];
          if (item.selected) {
            options.push(item.choice);
          } else {
            const index = options.indexOf(item.choice);
            if (index !== -1) {
              options.splice(index, 1);
            }
          }

          this.allMethods = options.length === protocolMethods.length;
          localStorage.setItem(METHOD_FILTER_NAME, JSON.stringify(options));
          $scope.tableControl.refresh();
        },
        filterStatus: function(item) {
          let options = JSON.parse(
            localStorage.getItem(STATUS_FILTER_NAME)
          ) || [...statusChoices];

          if (item.selected) {
            options.push(item.choice);
          } else {
            const index = options.indexOf(item.choice);
            if (index !== -1) {
              options.splice(index, 1);
            }
          }

          this.allStatus = options.length === statusChoices.length;
          localStorage.setItem(STATUS_FILTER_NAME, JSON.stringify(options));
          $scope.tableControl.refresh();
        },
        selectAllMethods: function(allSelected) {
          const filterOptions = {
            filterTypes: this.methodTypes,
            choices: protocolMethods,
            storageName: METHOD_FILTER_NAME
          };
          this.allMethods = allSelected;
          selectAllOptions(allSelected, filterOptions);
        },
        selectAllStatus: function(allSelected) {
          const filterOptions = {
            filterTypes: this.statusTypes,
            choices: statusChoices,
            storageName: STATUS_FILTER_NAME
          };
          this.allStatus = allSelected;
          selectAllOptions(allSelected, filterOptions);
        },
        clearFilters: function() {
          $scope.tableControl.clearSearch();
        }
      }
    };

    $scope.tableControl.duplicate = function(record) {
      const transect_type = ProjectService.getTransectType(
        record.data.protocol
      );
      record.clone().then(function(rec) {
        const clear_fields = transect_type.fields || [];
        _.each(clear_fields, function(cf) {
          _.set(rec, cf, null);
        });

        rec.update().then(function() {
          $state.go(transect_type.state, { id: rec.id });
        });
      });
    };

    $scope.tableControl.getFilteredRecordsCount = function() {
      const tableRecordsTotal =
        $scope.tableControl.getPaginationTable() &&
        $scope.tableControl.getPaginationTable().total;

      return `${tableRecordsTotal}/${collectRecordsCount}`;
    };

    $scope.tableControl.noAppliedFilters = function() {
      const searchBoxNotUsed = !$scope.tableControl.textboxFilterUsed();

      const methodStorageSelectAll = checkLocalStorage(
        'all',
        protocolMethods,
        METHOD_FILTER_NAME
      );
      const statusStorageSelectAll = checkLocalStorage(
        'all',
        statusChoices,
        STATUS_FILTER_NAME
      );

      return (
        searchBoxNotUsed && methodStorageSelectAll && statusStorageSelectAll
      );
    };

    $q.all(promises).then(function(output) {
      collectRecordsTable = output[1];
      $scope.currentUser = output[0];
      collectRecordsTable
        .filter({ profile: $scope.currentUser.id }, true)
        .then(function(val) {
          collectRecordsCount = val.length;
        });

      $scope.resource = new PaginatedOfflineTableWrapper(collectRecordsTable, {
        searchFields: [
          'data.protocol',
          '$$sites.name',
          '$$managements.name',
          'data.observers,profile_name'
        ],
        sortFields: {
          transect_number: function(record) {
            if (record.data.fishbelt_transect) {
              return Number(record.data.fishbelt_transect.number);
            } else if (record.data.benthic_transect) {
              return Number(record.data.benthic_transect.number);
            }
            return null;
          },
          transect_length: function(record) {
            return sizeFormat(record.data).toString();
          }
        }
      });
    });

    OfflineTables.ProjectSitesTable(project_id).then(function(table) {
      table.filter().then(function(sites) {
        $scope.choices.sites = _.map(sites, function(site) {
          return { id: site.id, name: site.name };
        });
      });
    });

    function addTransect(transect_type) {
      $state.go(transect_type.state, { id: '' });
    }

    function selectAllOptions(allSelected, filter_options) {
      const filterTypes = filter_options.filterTypes;
      const storageName = filter_options.storageName;
      let options = JSON.parse(localStorage.getItem(storageName)) || [
        ...filter_options.choices
      ];

      if (allSelected) {
        filterTypes.forEach(filterItem => {
          if (!filterItem.selected) {
            options.push(filterItem.choice);
          }
          filterItem.selected = true;
        });
      } else {
        filterTypes.forEach(filterItem => (filterItem.selected = false));
        options = [];
      }
      localStorage.setItem(storageName, JSON.stringify(options));
      $scope.tableControl.refresh();
    }

    function loadButtons() {
      const buttons = _.map($scope.choices.transect_types, function(
        transect_type
      ) {
        const btn = new Button();
        btn.name = transect_type.name;
        btn.onlineOnly = false;
        btn.enabled = true;
        btn.click = function() {
          addTransect(transect_type);
        };
        return btn;
      });

      addTransectGroupButton.name = 'Add Sample Unit';
      addTransectGroupButton.icon = 'fa-plus';
      addTransectGroupButton.classes = 'btn-success';
      addTransectGroupButton.buttons = buttons;
      addTransectGroupButton.onlineOnly = false;
      addTransectGroupButton.enabled = false;

      $rootScope.PageHeaderButtons = [addTransectGroupButton];
    }

    loadButtons();
    $scope.$watch('isDisabled', function() {
      addTransectGroupButton.enabled = !$scope.isDisabled;
    });
  }
]);
