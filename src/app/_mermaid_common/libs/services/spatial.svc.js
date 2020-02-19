/* globals turf */
/* jshint strict: true */

angular.module('mermaid.libs').service('SpatialUtils', [
  function() {
    'use strict';

    const pointInPolygon = function(pointGeoJson, polygonGeoJson) {
      return turf.booleanPointInPolygon(pointGeoJson, polygonGeoJson);
    };

    return {
      pointInPolygon: pointInPolygon
    };
  }
]);
