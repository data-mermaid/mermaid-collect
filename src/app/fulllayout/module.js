'use strict';

angular
  .module('app.fulllayout', ['ui.router'])

  .config(function($stateProvider) {
    $stateProvider.state('fullapp', {
      abstract: true,
      views: {
        root: {
          templateUrl: 'app/fulllayout/views/fulllayout.tpl.html'
        }
      }
    });
  });
