angular.module('app.project').controller('ContactCtrl', [
  '$rootScope',
  '$scope',
  '$state',
  'Button',
  'connectivity',
  'ConnectivityFactory',
  '$http',
  'utils',
  'authService',
  function(
    $rootScope,
    $scope,
    $state,
    Button,
    connectivity,
    ConnectivityFactory,
    $http,
    utils,
    authService
  ) {
    'use strict';

    $scope.contact = {};
    var conn = new ConnectivityFactory($scope);

    var sendMessage = function() {
      authService.getCurrentUser().then(function(currentUser) {
        $scope.contact.email = currentUser.email;
        var encodedData = Object.keys($scope.contact)
          .map(function(k) {
            return (
              encodeURIComponent(k) +
              '=' +
              encodeURIComponent($scope.contact[k])
            );
          })
          .join('&');
        var config = {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        };
        var url =
          'https://script.google.com/macros/s/AKfycbz7Gf3f4Q0DLmpJLK6F2UNwHLH' +
          'szYbcS6RazlTP--SyUhdS6hQ/exec';
        $http.post(url, encodedData, config).then(function(resp) {
          if (resp.status !== 200) {
            utils.showAlert(
              'Error',
              resp.status + ': Problem sending your message.',
              utils.statuses.error
            );
            return;
          }
          utils.showAlert(
            'Message Sent',
            'Message sent successfully. We shall respond ' +
              'as soon as possible.',
            utils.statuses.success,
            5000
          );
        });
        $state.go('fullapp.projects');
      });
    };

    var sendMessageButton = new Button();
    sendMessageButton.name = 'Send Message';
    sendMessageButton.enabled = true;
    sendMessageButton.visible = connectivity.isOnline;
    sendMessageButton.classes = 'btn-success';
    sendMessageButton.onlineOnly = true;
    sendMessageButton.click = sendMessage;

    $rootScope.PageHeaderButtons = [sendMessageButton];

    conn.on('profile', function(event) {
      sendMessageButton.visible = event.event === 'online';
    });

    $scope.$watch(
      function() {
        return $scope.form && $scope.form.$valid && $scope.form.$dirty;
      },
      function(v) {
        sendMessageButton.enabled = v;
      }
    );
  }
]);
