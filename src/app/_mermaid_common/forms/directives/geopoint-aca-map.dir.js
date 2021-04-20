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
        const recordMarker = new mapboxgl.Marker({ draggable: true });

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
          AcaMapService.setBasicMapControl(map, { showZoom: true });
          AcaMapService.loadACALayers(map);
          AcaMapService.setAllLayersPaintProperty(map);

          scope.$watchGroup(
            ['widgetLat', 'widgetLng', 'map'],
            function(n) {
              if (n[0] == null || n[1] == null || n[0] > 90 || n[0] < -90) {
                recordMarker.setLngLat(defaultCenter).addTo(map); // set default center marker when new site is being created
              } else {
                recordMarker.setLngLat([n[1], n[0]]).addTo(map);
              }

              recordMarker.on('dragend', function() {
                const lngLat = recordMarker.getLngLat();
                scope.widgetForm.$setDirty();
                scope.widgetLat = lngLat.lat;
                scope.widgetLng = lngLat.lng;
              });

              if (n[0] !== undefined && n[1] !== undefined) {
                map.jumpTo({
                  center: [n[1], n[0]],
                  zoom: defaultZoom
                });
              }
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
