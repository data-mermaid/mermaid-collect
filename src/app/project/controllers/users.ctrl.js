angular.module('app.project').controller('UsersCtrl', [
  '$scope',
  '$stateParams',
  'offlineservice',
  'utils',
  '$q',
  'Profile',
  'authService',
  'PaginatedOfflineTableWrapper',
  'ProjectService',
  'ModalService',
  function(
    $scope,
    $stateParams,
    offlineservice,
    utils,
    $q,
    Profile,
    authService,
    PaginatedOfflineTableWrapper,
    ProjectService,
    ModalService
  ) {
    'use strict';
    var project_profile_table;
    var project_id = $stateParams.project_id;
    var default_role;

    $scope.tableControl = {};
    $scope.data = {};
    $scope.project_profile_ids = [];
    $scope.tableControl.isDisabled = true;
    $scope.tableControl.isAdmin = false;

    ProjectService.getMyProjectProfile(project_id).then(function(
      projectProfile
    ) {
      $scope.tableControl.isDisabled =
        !projectProfile || projectProfile.is_admin !== true;
      $scope.tableControl.isAdmin =
        projectProfile && projectProfile.is_admin === true;
    });

    $scope.tableControl.choices = {};
    offlineservice.ChoicesTable().then(function(table) {
      table
        .filter({
          name: 'roles'
        })
        .then(function(choices) {
          $scope.tableControl.choices.roles = choices[0].data;
          default_role = _.sortBy($scope.tableControl.choices.roles, 'id')[1]
            .id;
        });
    });

    $scope.tableControl.roles = utils.roles;

    $scope.tableControl.removeUser = function(record) {
      return offlineservice
        .CollectRecordsTable(project_id)
        .then(function(table) {
          return table.count({ profile: record.profile });
        })
        .then(function(count) {
          if (count > 0) {
            $scope.tableControl.transferSampleUnits(record);
          } else {
            var removeUser = function() {
              record.delete().then(function() {
                $scope.tableControl.refresh();
              });
            };
            utils.showConfirmation(
              removeUser,
              'Remove User',
              'Are you sure you want to remove this user?',
              '[Cancel][Remove User]'
            );
          }
        });
    };

    $scope.tableControl.saveUser = function(record) {
      record.update();
    };

    var userPromise = authService.getCurrentUser();
    var projectProfilePromise = offlineservice.ProjectProfilesTable(project_id);

    $q.all([userPromise, projectProfilePromise]).then(function(results) {
      $scope.tableControl.currentUser = results[0];
      project_profile_table = results[1];
      $scope.resource = new PaginatedOfflineTableWrapper(project_profile_table);
    });

    $scope.tableConfig = {
      id: 'users',
      defaultSortByColumn: 'profile_name',
      searching: false,
      rowSelect: false,
      filters: { project_pk: project_id },
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
          tdTemplateUrl: 'app/project/partials/users-table-buttons.tpl.html'
        }
      ],
      toolbar: {
        template: 'app/project/partials/users-toolbar.tpl.html',
        addUser: function(model) {
          var email = model.email;
          if (
            $scope.tableControl.isDisabled ||
            email == null ||
            email.length === 0
          ) {
            return;
          }

          var profile_promise = Profile.query({ email: email }).$promise;

          profile_promise.then(function(resp) {
            if (resp.count === 0) {
              var missing_msg = "User doesn't exist.";
              utils.showAlert('Warning', missing_msg, utils.warning, 4000);
              return;
            }
            var profile = resp.results[0];
            project_profile_table
              .filter({ profile: profile.id })
              .then(function(profile_recs) {
                if (profile_recs.length > 0) {
                  var duplicate_msg = 'User has already been added to project.';
                  utils.showAlert(
                    'Warning',
                    duplicate_msg,
                    utils.warning,
                    4000
                  );
                  return;
                }
                var new_project_profile = {
                  role: default_role,
                  project: project_id,
                  profile: profile.id
                };
                model.email = null;
                project_profile_table
                  .create(new_project_profile)
                  .then($scope.tableControl.refresh);
              });
          });
        }
      }
    };

    $scope.tableControl.transferSampleUnits = function(projectProfile) {
      var modal;
      var modalOptions = {
        hideHeader: true,
        controller: 'TransferSampleUnitsCtrl',
        bodyTemplateUrl: 'app/project/partials/transfer-sample-units.tpl.html',
        resolve: {
          fromOwner: function($q) {
            return $q.resolve(projectProfile);
          },
          ownerChoices: function() {
            return project_profile_table.filter({
              id: function(val, record) {
                return (
                  val !== projectProfile.id &&
                  (record.is_collector === true || record.is_admin === true)
                );
              }
            });
          },
          currentProfile: function($q) {
            return $q.resolve($scope.tableControl.currentUser);
          }
        }
      };
      modal = ModalService.open(modalOptions);
      modal.result.then(function(toProfileId) {
        ProjectService.transferSampleUnitOwnership(
          project_id,
          projectProfile.profile,
          toProfileId
        )
          .then(function(resp) {
            var numTransferred = resp.data.num_collect_records_transferred;
            var msg = numTransferred;
            msg += utils.pluralize(
              numTransferred,
              ' Sample Unit',
              ' Sample Units'
            );
            msg += ' transferred';
            utils.showAlert('Success', msg, utils.statuses.success, 5000);
            return offlineservice.CollectRecordsTable(project_id);
          })
          .catch(function(err) {
            if (err.status !== 500) {
              utils.errorAlert(err.data);
            } else {
              utils.showAlert(
                'Error',
                'Error while transferring sample untils',
                utils.statuses.error,
                5000
              );
            }
            throw err;
          });
      });
    };
  }
]);
