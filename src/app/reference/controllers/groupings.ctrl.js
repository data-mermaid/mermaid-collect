angular.module('app.reference').controller('GroupingsCtrl', [
  '$scope',
  'groupings',
  'fishFamilies',
  '$filter',
  function($scope, groupings, fishFamilies, $filter) {
    'use strict';
    console.log(fishFamilies);
    console.log(groupings[0]);
    const newGroupings = groupings[0].fish_attributes.map(function(item) {
      return $filter('matchchoice')(item, fishFamilies);
    });
    $scope.groupingsItem = newGroupings;
  }
]);
