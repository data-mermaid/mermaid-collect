angular.module('app.sandbox', []).config(function($stateProvider) {
  'use strict';

  $stateProvider.state('fullapp.sandbox', {
    url: '/sandbox',
    data: {
      title: 'Sandbox'
    },
    views: {
      'content@fullapp': {
        templateUrl: 'app/sandbox/sandbox.tpl.html',
        controller: 'SandboxCtrl'
      }
    }
  });
});
