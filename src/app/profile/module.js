angular.module('app.profile', []).config(function($stateProvider) {
  'use strict';

  const checkAuthentication = function($transition$) {
    const authService = $transition$.injector().get('authService');
    if (!authService.isAuthenticated()) {
      return authService.login();
    }
  };

  $stateProvider
    .state('fullapp.profile', {
      url: '/me',
      data: {
        title: 'Profile'
      },
      onEnter: checkAuthentication,
      views: {
        'content@fullapp': {
          templateUrl: 'app/profile/partials/profile.tpl.html',
          controller: 'ProfileCtrl'
        }
      }
    })
    .state('fullapp.profile2', {
      url: '/me/',
      data: {
        title: 'Profile'
      },
      onEnter: checkAuthentication,
      views: {
        'content@fullapp': {
          templateUrl: 'app/profile/partials/profile.tpl.html',
          controller: 'ProfileCtrl'
        }
      }
    });
});
