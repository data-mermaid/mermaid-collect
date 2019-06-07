angular.module('app.profile').controller('ProfileCtrl', [
  '$rootScope',
  '$scope',
  '$http',
  'authService',
  'APP_CONFIG',
  'localStorageService',
  'Button',
  'connectivity',
  'ConnectivityFactory',
  'utils',
  function(
    $rootScope,
    $scope,
    $http,
    authService,
    APP_CONFIG,
    localStorageService,
    Button,
    connectivity,
    ConnectivityFactory,
    utils
  ) {
    'use strict';

    var conn = new ConnectivityFactory($scope);
    $scope.profile = {};

    authService.getCurrentUser().then(function(profile) {
      $scope.profile = profile;
    });

    $scope.sendChangePasswordEmail = function() {
      return $http
        .post(APP_CONFIG.apiUrl + 'me/change_password/')
        .then(function(resp) {
          if (resp.status === 200) {
            utils.showAlert('Success', resp.data, utils.statuses.success);
          } else if (resp.status === 400) {
          }
        })
        .catch(function(error) {
          utils.showAlert('Warning', error.data[0], utils.statuses.warning);
          return error;
        });
    };

    var save = function() {
      return $http
        .put(APP_CONFIG.apiUrl + 'me/', $scope.profile)
        .then(function(resp) {
          if (resp.status === 200) {
            localStorageService.set('user', resp.data);
          }
          $scope.profile = resp.data;
          $scope.form.$setPristine();
          utils.showAlert('Success', 'Profile updated', utils.statuses.success);
        });
    };

    var saveButton = new Button();
    saveButton.name = 'Save';
    saveButton.enabled = false;
    saveButton.visible = connectivity.isOnline;
    saveButton.classes = 'btn-success';
    saveButton.icon = 'fa fa-save';
    saveButton.onlineOnly = false;
    saveButton.click = save;

    $rootScope.PageHeaderButtons = [saveButton];

    $scope.$watch(
      'profile',
      function() {
        if (!$scope.form) {
          return;
        }
        saveButton.enabled = $scope.form.$dirty && $scope.form.$valid;
      },
      true
    );

    conn.on('profile', function(event) {
      saveButton.visible = event.event === 'online';
    });
  }
]);
