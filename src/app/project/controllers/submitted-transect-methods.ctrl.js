angular.module('app.project').controller('SubmittedTransectMethodsCtrl', [
  '$rootScope',
  '$scope',
  '$stateParams',
  '$filter',
  'ProjectService',
  'TransectService',
  'SampleUnitMethod',
  'sites',
  'Button',
  function(
    $rootScope,
    $scope,
    $stateParams,
    $filter,
    ProjectService,
    TransectService,
    SampleUnitMethod,
    sites,
    Button
  ) {
    'use strict';
    // var records = [];
    var project_id = $stateParams.project_id;

    $scope.tableControl = {};
    $scope.isDisabled = true;
    $scope.choices = {};
    $scope.choices.transect_types = ProjectService.transect_types;

    var protocolMethods = [
      ProjectService.FISH_BELT_TRANSECT_TYPE,
      ProjectService.BENTHIC_LIT_TRANSECT_TYPE,
      ProjectService.BENTHIC_PIT_TRANSECT_TYPE,
      ProjectService.HABITAT_COMPLEXITY_TRANSECT_TYPE,
      ProjectService.BLEACHING_QC_QUADRAT_TYPE
    ];
    var protocolMethodsLength = protocolMethods.length;

    ProjectService.getMyProjectProfile(project_id).then(function(
      projectProfile
    ) {
      $scope.tableControl.isDisabled =
        !projectProfile || projectProfile.is_admin !== true;
    });

    var downloadFieldReport = function(method) {
      TransectService.downloadFieldReport(project_id, method);
    };

    var checkLocalStorage = function(item, choices, storageName) {
      var options = JSON.parse(localStorage.getItem(storageName)) || choices;
      if (item === 'all') {
        return options.length === choices.length;
      } else if (options.indexOf(item) !== -1) {
        return true;
      }
      return false;
    };

    $scope.tableConfig = {
      id: 'submitted_transects',
      defaultSortByColumn: 'protocol_name',
      searching: true,
      searchPlaceholder:
        'Filter sample units by method, site, management, or observer',
      searchIcon: 'fa-filter',
      searchLocation: 'right',
      rowSelect: false,
      hideRowStripes: true,
      filters: {
        project_pk: project_id,
        protocol: (
          JSON.parse(localStorage.getItem('submit_methodfilter')) ||
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
          sort_by: ['depth']
        },
        {
          name: 'sample_date',
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
          name: 'observers',
          display: 'Observers',
          sortable: false,
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
        exportTransect: function(transectmethod) {
          downloadFieldReport(transectmethod);
        },
        filterMethod: function(item) {
          const { choice, selected } = item;
          let options =
            JSON.parse(localStorage.getItem('submit_methodfilter')) ||
            protocolMethods;
          if (selected) {
            options.push(choice);
          } else {
            var index = options.indexOf(choice);
            if (index !== -1) {
              options.splice(index, 1);
            }
          }

          this.allMethods = options.length === protocolMethodsLength;
          localStorage.setItem('submit_methodfilter', JSON.stringify(options));
          $scope.tableControl.setFilterParam(
            'protocol',
            options.join(','),
            true
          );
          $scope.tableControl.refresh();
        },
        selectAllMethods: function(allSelected) {
          let methodTypes = this.methodTypes;
          let options =
            JSON.parse(localStorage.getItem('submit_methodfilter')) ||
            protocolMethods;
          if (allSelected) {
            for (const method of methodTypes) {
              if (!method.selected) {
                options.push(method.choice);
              }
              method.selected = true;
            }
          } else {
            for (const method of methodTypes) {
              method.selected = false;
            }
            options = [];
          }

          localStorage.setItem('submit_methodfilter', JSON.stringify(options));
          $scope.tableControl.setFilterParam(
            'protocol',
            options.join(','),
            true
          );
          $scope.tableControl.refresh();
        },
        allMethods: checkLocalStorage(
          'all',
          protocolMethods,
          'submit_methodfilter'
        ),
        methodTypes: [
          {
            name: 'Fish Belt',
            choice: protocolMethods[0],
            selected: checkLocalStorage(
              protocolMethods[0],
              protocolMethods,
              'submit_methodfilter'
            )
          },
          {
            name: 'Benthic LIT',
            choice: protocolMethods[1],
            selected: checkLocalStorage(
              protocolMethods[1],
              protocolMethods,
              'submit_methodfilter'
            )
          },
          {
            name: 'Benthic PIT',
            choice: protocolMethods[2],
            selected: checkLocalStorage(
              protocolMethods[2],
              protocolMethods,
              'submit_methodfilter'
            )
          },
          {
            name: 'Bleaching',
            choice: protocolMethods[4],
            selected: checkLocalStorage(
              protocolMethods[4],
              protocolMethods,
              'submit_methodfilter'
            )
          },
          {
            name: 'Habitat Complexity',
            choice: protocolMethods[3],
            selected: checkLocalStorage(
              protocolMethods[3],
              protocolMethods,
              'submit_methodfilter'
            )
          }
        ]
      }
    };
    $scope.resource = SampleUnitMethod;

    const buttons = [];
    _.each($scope.choices.transect_types, function(transect_type) {
      if (transect_type.method) {
        var btn = new Button();
        btn.name = transect_type.name;
        btn.protocol = transect_type.protocol;
        btn.onlineOnly = true;
        btn.enabled = true;
        btn.click = function() {
          downloadFieldReport(transect_type.method);
        };
        buttons.push(btn);
      }
    });

    const fieldReportButton = new Button();
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
