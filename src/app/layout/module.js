'use strict';

angular
  .module('app.layout', ['ui.router'])

  .config(function($stateProvider) {
    $stateProvider.state('app', {
      abstract: true,
      url: '',
      data: {
        navTemplate: 'app/layout/partials/navigation.tpl.html'
      },
      views: {
        root: {
          templateUrl: 'app/layout/layout.tpl.html'
        }
      }
    });
  });
