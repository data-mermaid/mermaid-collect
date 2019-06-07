angular.module('app.profile', []).config(function($stateProvider) {
  'use strict';
  $stateProvider
    .state('fullapp.profile', {
      url: '/me',
      data: {
        title: 'Profile'
      },
      loginRequired: true,
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
      loginRequired: true,
      views: {
        'content@fullapp': {
          templateUrl: 'app/profile/partials/profile.tpl.html',
          controller: 'ProfileCtrl'
        }
      }
    });
});
