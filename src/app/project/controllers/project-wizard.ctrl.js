angular.module('app.project').controller('ProjectWizardCtrl', [
  '$scope',
  '$timeout',
  '$state',
  '$http',
  'APP_CONFIG',
  'OfflineCommonTables',
  'authService',
  'utils',
  'PaginatedArrayWrapper',
  'Profile',
  'ProjectService',
  'ErrorRenderer',
  'blockUI',
  'Site',
  'CopySitesService',
  'CopyManagementsService',
  'tags',
  function(
    $scope,
    $timeout,
    $state,
    $http,
    APP_CONFIG,
    OfflineCommonTables,
    authService,
    utils,
    PaginatedArrayWrapper,
    Profile,
    ProjectService,
    ErrorRenderer,
    blockUI,
    Site,
    CopySitesService,
    CopyManagementsService,
    tags
  ) {
    'use strict';

    /*
      - Grab current user and add as a admin to the project by default
      - Save Project
      - Add all users
      - Copy all Sites
      - Copy all Managements
    */

    var defaultRole;
    var siteService;
    var managementService;

    $scope.isCreating = false;
    $scope.currentStep = 1;
    $scope.currentUser = null;
    $scope.map = null;
    $scope.project = {};
    $scope.profiles = [];
    $scope.sites = [];
    $scope.managements = [];
    $scope.selectedSiteRecords = [];
    $scope.selectedManagementRecords = [];
    $scope.profilesTableControl = {};
    $scope.choices = utils.choices;
    $scope.profilesResource = new PaginatedArrayWrapper($scope.profiles);
    $scope.benthicPolicies = {};
    $scope.organization = {};
    $scope.tags = _.uniq(tags.results, 'id');
    $scope.projectStatuses = {};
    $scope.project.tags = [];

    var addUser = function(model, role) {
      role = role || defaultRole;
      var email = model.email;
      if (email == null || email.length === 0) {
        return;
      }

      var profile_promise = Profile.query({ email: email }).$promise;

      profile_promise.then(function(resp) {
        if (resp.count === 0) {
          var missing_msg = "User doesn't exist.";
          utils.showAlert('Warning', missing_msg, utils.statuses.warning, 4000);
          return;
        }
        var profile = resp.results[0];
        if (_.filter($scope.profiles, { profile: profile.id }).length > 0) {
          var msg = 'User has already been added to project.';
          utils.showAlert('Warning', msg, utils.statuses.warning, 4000);
          return;
        }

        var new_project_profile = {
          profile_name: email,
          role: role.id,
          profile: profile.id
        };
        $scope.profiles.push(new_project_profile);
        model.email = null;
        $scope.profilesTableControl.refresh();
      });
    };

    OfflineCommonTables.ChoicesTable()
      .then(function(table) {
        return table.filter().then(function(choices) {
          _.each(choices, function(choice_set) {
            if (choice_set.name === 'roles') {
              $scope.choices.roles = _.sortBy(choice_set.data, 'id');
              defaultRole = $scope.choices.roles[1];
            } else if (choice_set.name === 'datapolicies') {
              ProjectService.setupFormDataPolicies($scope, choice_set.data);
            }
          });
          $scope.profilesTableControl.choices = {
            roles: $scope.choices.roles
          };
        });
      })
      .then(function() {
        authService.getCurrentUser().then(function(currentUser) {
          $scope.currentUser = currentUser;
          $scope.profilesTableControl.currentUser = currentUser;
          $scope.project.data_policy_beltfish = $scope.project.data_policy;
          $scope.project.data_policy_bleachingqc = $scope.project.data_policy;
          $scope.benthicPolicies.data_policy_benthics =
            $scope.project.data_policy;
          var adminRole = _.filter($scope.choices.roles, { name: 'admin' })[0];
          addUser(currentUser, adminRole);
        });
      });

    $scope.profilesTableConfig = {
      id: 'users',
      disableTrackingTableState: true,
      defaultSortByColumn: 'profile_name',
      searching: false,
      rowSelect: false,
      sort_by: ['profile_name'],
      cols: [
        { name: 'profile_name', display: 'Name', sortable: true },
        {
          name: 'role',
          display: 'Role',
          sortable: true,
          tdTemplateUrl: 'app/project/partials/td-roles.tpl.html'
        },
        {
          sortable: false,
          tdTemplate:
            '<a offlinehide ' +
            'ng-hide="control.currentUser.id === record.profile || ' +
            'control.isAdmin === false"' +
            'class="btn btn-sm btn-danger" ' +
            'confirm-fx="control.removeUser(record)" ' +
            'confirm-title="Remove User"' +
            'confirm-message="Are you sure you want to remove this user?" ' +
            'confirm-buttons="[Cancel][Remove User]" confirm>' +
            'Remove User</a>'
        }
      ],
      toolbar: {
        template: 'app/project/partials/users-toolbar.tpl.html',
        addUser: addUser
      }
    };

    $scope.profilesTableControl.removeUser = function(record) {
      var idx = $scope.profiles.indexOf(record);
      if (idx !== -1) {
        $scope.profiles.splice(idx, 1);
        $scope.profilesTableControl.refresh();
      }
    };

    // Sort out refreshing map because it's rendered
    // before the containing div is hidden.
    $scope.invalidateMap = function(attempts) {
      attempts = attempts || 0;
      attempts += 1;
      if ($('[data-smart-wizard-pane="3"]').css('display') !== 'none') {
        $scope.map.invalidateSize();
        return;
      }
      if (attempts === 5) {
        return;
      }
      $timeout(function() {
        $scope.invalidateMap(attempts);
      }, 100);
    };

    $scope.mapopts = { gestureHandling: true };

    $scope.setBenthicPolicies = function(policy) {
      $scope.project.data_policy_benthiclit = policy;
      $scope.project.data_policy_benthicpit = policy;
      $scope.project.data_policy_habitatcomplexity = policy;
    };

    $scope.copySelectedSites = function() {
      var selectedRecords = $scope.copySiteControl.getSelectedRecords();
      $scope.sites = _.uniq($scope.sites.concat(selectedRecords), 'id');
    };

    $scope.removeSite = function(site) {
      var idx = $scope.sites.indexOf(site);
      if (idx !== -1) {
        $scope.sites.splice(idx, 1);
      }
    };

    $scope.copySelectedManagements = function() {
      var selectedRecords = $scope.copyManagementControl.getSelectedRecords();
      $scope.managements = _.uniq(
        $scope.managements.concat(selectedRecords),
        'id'
      );
    };

    $scope.removeManagement = function(management) {
      var idx = $scope.managements.indexOf(management);
      if (idx !== -1) {
        $scope.managements.splice(idx, 1);
      }
    };

    $scope.removeUser = function(user) {
      var idx = $scope.profiles.indexOf(user);
      if (idx !== -1) {
        $scope.profiles.splice(idx, 1);
      }
    };

    var selectedSitesMessage = function() {
      var records = $scope.copySiteControl.getSelectedRecords();
      var recordCount = records.length;
      var result =
        (recordCount === 0 ? 'No' : recordCount) +
        ' ' +
        utils.pluralize(recordCount, 'site', 'sites') +
        ' selected';
      return result;
    };

    var toggleViewSelectedSites = function(selectedOnly) {
      if (selectedOnly) {
        var records = $scope.copySiteControl.getSelectedRecords();
        $scope.copySiteResource = PaginatedArrayWrapper(records);
      } else {
        $scope.copySiteResource = Site;
      }
      $scope.copySiteControl.refresh(true);
    };

    var selectedManagementMessage = function() {
      var records = $scope.copyManagementControl.getSelectedRecords();
      var recordCount = records.length;
      var result =
        (recordCount === 0 ? 'No' : recordCount) +
        ' ' +
        utils.pluralize(
          recordCount,
          'management regime',
          'management regimes'
        ) +
        ' selected';
      return result;
    };

    var toggleViewSelectedManagements = function(selectedOnly) {
      if (selectedOnly) {
        var records = $scope.copyManagementControl.getSelectedRecords();
        $scope.copyManagementResource = PaginatedArrayWrapper(records);
      } else {
        $scope.copyManagementResource = Site;
      }
      $scope.copyManagementControl.refresh(true);
    };

    siteService = _.assign(CopySitesService, {});
    $scope.copySiteControl = siteService.control;
    $scope.copySiteResource = siteService.resource;
    $scope.copySiteConfig = siteService.config;
    $scope.copySiteConfig.hideLimits = false;
    $scope.copySiteConfig.pagination.limit = 10;
    $scope.copySiteConfig.toolbar.toggleViewSelectedOnly = toggleViewSelectedSites;
    $scope.copySiteConfig.toolbar.message = selectedSitesMessage;

    managementService = _.assign(CopyManagementsService, {});
    $scope.copyManagementControl = managementService.control;
    $scope.copyManagementResource = managementService.resource;
    $scope.copyManagementConfig = managementService.config;
    $scope.copyManagementConfig.hideLimits = false;
    $scope.copyManagementConfig.pagination.limit = 10;
    $scope.copyManagementConfig.toolbar.toggleViewSelectedOnly = toggleViewSelectedManagements;
    $scope.copyManagementConfig.toolbar.message = selectedManagementMessage;

    $scope.$on('paginatedtable:toggle-selected', function() {
      $scope.selectedSiteRecords = $scope.copySiteControl.getSelectedRecords();
      $scope.selectedManagementRecords = $scope.copyManagementControl.getSelectedRecords();
    });

    $scope.$on('paginatedtable:clear-selected', function() {
      $scope.selectedSiteRecords = $scope.copySiteControl.getSelectedRecords();
      $scope.selectedManagementRecords = $scope.copyManagementControl.getSelectedRecords();
    });

    $scope.createProject = function(e) {
      e.preventDefault();
      const scopeTags = $scope.project.tags;
      delete $scope.project.tags;

      if ($scope.currentStep !== 6) {
        $scope.currentStep = 6;
        return;
      }
      $scope.isCreating = true;
      blockUI.start();
      var url = APP_CONFIG.apiUrl + 'projects/create_project/';

      // Set project status
      $scope.project.status =
        $scope.projectStatuses.isTest === true
          ? utils.project_statuses.test
          : utils.project_statuses.open;

      var data = {
        project: $scope.project,
        sites: $scope.sites,
        managements: $scope.managements,
        profiles: _.reject($scope.profiles, { profile: $scope.currentUser.id }),
        tags: scopeTags
      };

      return $http
        .post(url, data)
        .then(function(resp) {
          $scope.form.$setPristine();
          $state.go('app.project.records', { project_id: resp.data.id });
        })
        .catch(function(err) {
          if (err.status === 400) {
            $scope.formerrors = ErrorRenderer.render(err);
          }
        })
        .finally(function() {
          $scope.isCreating = false;
          blockUI.stop();
        });
    };
  }
]);
