angular.module('app.home', ['ui.router']).config(function($stateProvider) {
  'use strict';
  $stateProvider
    .state('fullapp.verifyemail', {
      url: '/verifyemail',
      data: {
        title: 'Verify Email'
      },
      views: {
        'content@fullapp': {
          templateUrl: 'app/home/partials/verifyemail.tpl.html'
        }
      }
    })
    .state('fullapp.error', {
      url: '/error',
      params: {
        rejection: null,
        apperror: null
      },
      views: {
        'content@fullapp': {
          templateUrl: 'app/home/partials/error.tpl.html',
          controller: 'ErrorCtrl'
        }
      }
    });
});
