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
  'offlineservice',
  'PaginatedOfflineTableWrapper',
  'ProjectService',
  'OfflineTableBackup',
  'ValidateSubmitService',
  'projectProfile',
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
    offlineservice,
    PaginatedOfflineTableWrapper,
    ProjectService,
    OfflineTableBackup,
    ValidateSubmitService,
    projectProfile
  ) {
    'use strict';

    var collectRecordsTable;
    var addTransectGroupButton;
    var promises;
    var project_id = $stateParams.project_id;

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

    var protocolMethods = [
      ProjectService.FISH_BELT_TRANSECT_TYPE,
      ProjectService.BENTHIC_LIT_TRANSECT_TYPE,
      ProjectService.BENTHIC_PIT_TRANSECT_TYPE,
      ProjectService.HABITAT_COMPLEXITY_TRANSECT_TYPE,
      ProjectService.BLEACHING_QC_QUADRAT_TYPE
    ];
    var statusChoices = [null, 'ok', 'warning', 'error'];
    var protocolMethodsLength = protocolMethods.length;
    var statusChoicesLength = statusChoices.length;

    var checkLocalStorage = function(item, choices, storageName) {
      var options = JSON.parse(localStorage.getItem(storageName)) || choices;
      if (item === 'all') {
        return options.length === choices.length;
      } else if (options.indexOf(item) !== -1) {
        return true;
      }
      return false;
    };

    var sizeFormat = function(value) {
      var result = '-';
      var protocol = value.protocol;
      if (protocol === ProjectService.FISH_BELT_TRANSECT_TYPE) {
        var width = _.get(value, 'fishbelt_transect.width');
        var widthFilter = $filter('matchchoice')(
          width,
          $scope.choices.belttransectwidths
        );
        var length = _.get(value, 'fishbelt_transect.len_surveyed');

        if (length && width) {
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

    ProjectService.fetchChoices().then(function(choices) {
      $scope.choices.belttransectwidths = choices.belttransectwidths;
    });

    $scope.tableControl.choices = $scope.choices;
    $scope.tableConfig = {
      id: 'collect_records',
      hideRowStripes: true,
      searching: true,
      searchPlaceholder: 'Filter sample units by method, site, or observer',
      searchIcon: 'fa-filter',
      searchLocation: 'right',
      defaultSortByColumn: 'data.protocol',
      rowFormatter: function(record, element) {
        element.addClass(ValidateSubmitService.transectStatusCssClass(record));
      },
      filters: {
        profile: projectProfile.profile,
        'data.protocol': function(val) {
          var options =
            JSON.parse(localStorage.getItem('collect_methodfilter')) ||
            protocolMethods;
          return options.indexOf(val) !== -1;
        },
        validations: function(val) {
          var options =
            JSON.parse(localStorage.getItem('collect_statusfilter')) ||
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
            var val = '';
            var label_val = '';
            var protocol = v.protocol;
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
            var val = '';
            if (v) {
              val = $filter('date')(new Date(v), 'dd-MMM-yyyy');
            }
            return val;
          }
        },
        {
          name: 'data.observers',
          display: 'Observers',
          sortable: false,
          formatter: function(v) {
            var observers = [];
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
          'collect_methodfilter'
        ),
        allStatus: checkLocalStorage(
          'all',
          statusChoices,
          'collect_statusfilter'
        ),
        methodTypes: [
          {
            name: 'Fish Belt',
            protocol: protocolMethods[0],
            selected: checkLocalStorage(
              protocolMethods[0],
              protocolMethods,
              'collect_methodfilter'
            )
          },
          {
            name: 'Benthic LIT',
            protocol: protocolMethods[1],
            selected: checkLocalStorage(
              protocolMethods[1],
              protocolMethods,
              'collect_methodfilter'
            )
          },
          {
            name: 'Benthic PIT',
            protocol: protocolMethods[2],
            selected: checkLocalStorage(
              protocolMethods[2],
              protocolMethods,
              'collect_methodfilter'
            )
          },
          {
            name: 'Bleaching',
            protocol: protocolMethods[4],
            selected: checkLocalStorage(
              protocolMethods[4],
              protocolMethods,
              'collect_methodfilter'
            )
          },
          {
            name: 'Habitat Complexity',
            protocol: protocolMethods[3],
            selected: checkLocalStorage(
              protocolMethods[3],
              protocolMethods,
              'collect_methodfilter'
            )
          }
        ],
        statusTypes: [
          {
            name: 'Saved',
            status: statusChoices[0],
            selected: checkLocalStorage(
              statusChoices[0],
              statusChoices,
              'collect_statusfilter'
            )
          },
          {
            name: 'Validated',
            status: statusChoices[1],
            selected: checkLocalStorage(
              statusChoices[1],
              statusChoices,
              'collect_statusfilter'
            )
          },
          {
            name: 'Warnings',
            status: statusChoices[2],
            selected: checkLocalStorage(
              statusChoices[2],
              statusChoices,
              'collect_statusfilter'
            )
          },
          {
            name: 'Errors',
            status: statusChoices[3],
            selected: checkLocalStorage(
              statusChoices[3],
              statusChoices,
              'collect_statusfilter'
            )
          }
        ],
        deleteSelected: function() {
          var records = $scope.tableControl.getSelectedRecords();
          if (_.isArray(records) === false || records.length === 0) {
            return;
          }
          var args = utils.templateArgs(records);
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
        filterMethod: function(showMethod, protocol) {
          var options =
            JSON.parse(localStorage.getItem('collect_methodfilter')) ||
            protocolMethods;

          if (showMethod === true) {
            options.push(protocol);
          } else {
            var index = options.indexOf(protocol);
            if (index !== -1) {
              options.splice(index, 1);
            }
          }

          this.allMethods = options.length === protocolMethodsLength;
          localStorage.setItem('collect_methodfilter', JSON.stringify(options));
          $scope.tableControl.refresh();
        },
        filterStatus: function(recordStatus, status) {
          var options =
            JSON.parse(localStorage.getItem('collect_statusfilter')) ||
            statusChoices;

          if (recordStatus === true) {
            options.push(status);
          } else {
            var index = options.indexOf(status);
            if (index !== -1) {
              options.splice(index, 1);
            }
          }

          this.allStatus = options.length === statusChoicesLength;
          localStorage.setItem('collect_statusfilter', JSON.stringify(options));
          $scope.tableControl.refresh();
        },
        backUp: function() {
          backupRecords();
        },
        selectAllMethods: function(allSelected) {
          var filterOptions = {
            filterTypes: this.methodTypes,
            filteredProperty: 'protocol',
            choices: protocolMethods,
            storageName: 'collect_methodfilter'
          };
          selectAllOptions(allSelected, filterOptions);
        },
        selectAllStatus: function(allSelected) {
          var filterOptions = {
            filterTypes: this.statusTypes,
            filteredProperty: 'status',
            choices: statusChoices,
            storageName: 'collect_statusfilter'
          };
          selectAllOptions(allSelected, filterOptions);
        }
      }
    };

    $scope.tableControl.duplicate = function(record) {
      var transect_type = ProjectService.getTransectType(record.data.protocol);
      record.clone().then(function(rec) {
        var clear_fields = transect_type.fields || [];
        _.each(clear_fields, function(cf) {
          _.set(rec, cf, null);
        });

        rec.update().then(function() {
          $state.go(transect_type.state, { id: rec.id });
        });
      });
    };

    promises = [
      authService.getCurrentUser(),
      offlineservice.CollectRecordsTable(project_id)
    ];

    $q.all(promises).then(function(output) {
      collectRecordsTable = output[1];
      $scope.currentUser = output[0];
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

    offlineservice.ProjectSitesTable(project_id).then(function(table) {
      table.filter().then(function(sites) {
        $scope.choices.sites = _.map(sites, function(site) {
          return { id: site.id, name: site.name };
        });
      });
    });

    function addTransect(transect_type) {
      $state.go(transect_type.state, { id: '' });
    }

    function backupRecords() {
      OfflineTableBackup.backup(project_id).then(function(recordCount) {
        if (recordCount && recordCount > 0) {
          var msg =
            recordCount +
            ' ' +
            utils.pluralize(recordCount, 'record', 'records') +
            ' backed up';
          utils.showAlert('Backup', msg, utils.statuses.success);
          return;
        }
        utils.showAlert(
          'Backup',
          'No records backed up',
          utils.statuses.warning
        );
      });
    }

    function selectAllOptions(allSelected, filter_options) {
      var {
        filterTypes,
        filteredProperty,
        choices,
        storageName
      } = filter_options;
      var options = JSON.parse(localStorage.getItem(storageName)) || choices;

      if (allSelected) {
        filterTypes.map(type => {
          if (!type.selected) {
            options.push(type[filteredProperty]);
          }
          type.selected = true;
        });
      } else {
        filterTypes.map(type => (type.selected = false));
        options = [];
      }
      localStorage.setItem(storageName, JSON.stringify(options));
      $scope.tableControl.refresh();
    }

    function loadButtons() {
      var buttons = _.map($scope.choices.transect_types, function(
        transect_type
      ) {
        var btn = new Button();
        btn.name = transect_type.name;
        btn.onlineOnly = false;
        btn.enabled = true;
        btn.click = function() {
          addTransect(transect_type);
        };
        return btn;
      });
      addTransectGroupButton = new Button();
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
