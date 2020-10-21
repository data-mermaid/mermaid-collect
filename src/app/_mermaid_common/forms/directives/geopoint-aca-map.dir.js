/* globals mapboxgl */

angular.module('mermaid.libs').directive('geopointAcaMap', [
  'localStorageService',
  'AcaMapService',
  function(localStorageService, AcaMapService) {
    'use strict';
    return {
      restrict: 'EA',
      scope: {
        widgetForm: '=',
        widgetLat: '=',
        widgetLng: '='
      },
      link: function(scope, element) {
        scope.markerLat = null;
        scope.markerLng = null;
        const recordMarker = new mapboxgl.Marker();

        const defaultCenter = [0, 0];
        const defaultZoom = 11;

        const map = new mapboxgl.Map({
          container: element[0],
          style: AcaMapService.satelliteBaseMap,
          center: defaultCenter, // starting position [lng, lat]
          zoom: defaultZoom, // starting zoom
          maxZoom: 16,
          attributionControl: true,
          customAttribution:
            'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community &copy; <a href="http://www.allencoralatlas.org/">2019 Allen Coral Atlas Partnership and Vulcan, Inc.</a>'
        });

        map.on('load', function() {
          AcaMapService.setBasicMapControl(map);
          AcaMapService.loadACALayers(map);
          AcaMapService.setAllLayersPaintProperty(map);

          scope.$watchGroup(
            ['widgetLat', 'widgetLng', 'map'],
            function(n) {
              if (n[0] == null || n[1] == null || n[0] > 90 || n[0] < -90) {
                return;
              }

              if (_.isNaN(n[0]) || _.isNaN(n[1])) {
                return;
              }

              if (
                (scope.markerLat && scope.markerLat !== n[0]) ||
                (scope.markerLng && scope.markerLng !== n[1])
              ) {
                recordMarker.remove();
              }

              recordMarker.setLngLat([n[1], n[0]]).addTo(map);
              map.jumpTo({
                center: [n[1], n[0]],
                zoom: defaultZoom
              });
              scope.markerLat = n[0];
              scope.markerLng = n[1];
            },
            true
          );
        });

        scope.$watch(
          function() {
            return localStorageService.get('benthic_legend');
          },
          function(storageVal, oldStorageValue) {
            if (storageVal !== oldStorageValue) {
              map.setPaintProperty(
                'atlas-benthic',
                'fill-opacity',
                AcaMapService.applyOpacityExpression(storageVal)
              );
            }
          },
          true
        );

        scope.$watch(
          function() {
            return localStorageService.get('geomorphic_legend');
          },
          function(storageVal, oldStorageValue) {
            if (storageVal !== oldStorageValue) {
              map.setPaintProperty(
                'atlas-geomorphic',
                'fill-opacity',
                AcaMapService.applyOpacityExpression(storageVal)
              );
            }
          },
          true
        );

        scope.$watch(
          function() {
            return localStorageService.get('coral_mosaic');
          },
          function(storageVal, oldStorageValue) {
            if (storageVal !== oldStorageValue) {
              map.setPaintProperty(
                'atlas-planet',
                'raster-opacity',
                storageVal
              );
            }
          },
          true
        );
      }
    };
  }
]);
