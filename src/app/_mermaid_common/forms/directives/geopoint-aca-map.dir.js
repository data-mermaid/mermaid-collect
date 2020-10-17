/* globals mapboxgl */

angular.module('mermaid.libs').directive('geopointAcaMap', [
  function() {
    'use strict';
    return {
      scope: {
        widgetForm: '=',
        widgetLat: '=',
        widgetLng: '='
      },
      link: function(scope, element) {
        scope.markerLat = null;
        scope.markerLng = null;
        const recordMarker = new mapboxgl.Marker();

        const init = true;
        const defaultCenter = [0, 0];
        const defaultZoom = 11;
        const navigation = new mapboxgl.NavigationControl({
          showCompass: false,
          showZoom: true
        });
        L.Icon.Default.imagePath = 'styles/css/images';

        function normalizeLng(lng) {
          if (lng < -180 || lng > 180) {
            return wrapNum(lng, [-180, 180], true);
          }
          return lng;
        }

        const worldBaseMap = {
          version: 8,
          name: 'World Map',
          sources: {
            worldmap: {
              type: 'raster',
              tiles: [
                'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
              ]
            }
          },
          layers: [
            {
              id: 'base-map',
              type: 'raster',
              source: 'worldmap'
            }
          ]
        };

        const map = new mapboxgl.Map({
          container: element[0],
          style: worldBaseMap,
          center: defaultCenter, // starting position [lng, lat]
          zoom: defaultZoom, // starting zoom
          maxZoom: 16,
          attributionControl: true
          // customAttribution:
          //   'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community &copy; <a href="http://www.allencoralatlas.org/">2019 Allen Coral Atlas Partnership and Vulcan, Inc.</a>'
        });

        map.on('load', function() {
          map.addControl(navigation, 'top-left');
          map.dragRotate.disable();
          map.touchZoomRotate.disableRotation();

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
                console.log('if found different => remove');
                recordMarker.remove();
              }

              recordMarker.setLngLat([n[1], n[0]]).addTo(map);
              map.jumpTo({
                center: [n[1], n[0]],
                zoom: 12
              });
              scope.markerLat = n[0];
              scope.markerLng = n[1];
            },
            true
          );
        });
      }
    };
  }
]);
