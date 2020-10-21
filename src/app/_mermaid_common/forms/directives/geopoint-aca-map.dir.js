/* globals mapboxgl */

angular.module('mermaid.libs').directive('geopointAcaMap', [
  'localStorageService',
  function(localStorageService) {
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
        const navigation = new mapboxgl.NavigationControl({
          showCompass: false,
          showZoom: true
        });

        const applyOpacityExpression = function(array) {
          if (array === null) {
            return false;
          }

          const arrayExp = array.flatMap(item => {
            let equalBenthic = [['==', ['get', 'class_name']], 1];
            equalBenthic[0].push(item);

            return equalBenthic;
          });

          arrayExp.unshift('case');
          arrayExp.push(0);
          return array.length > 0 ? arrayExp : 0;
        };
        const fillOpacityValue = applyOpacityExpression(
          localStorageService.get('benthic_legend')
        );
        const fillGeomorphicOpacityValue = applyOpacityExpression(
          localStorageService.get('geomorphic_legend')
        );
        const rasterOpacityValue = localStorageService.get('coral_mosaic');

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

        scope.fillOpacityExpression =
          fillOpacityValue === 0 || fillOpacityValue
            ? fillOpacityValue
            : [
                'case',
                ['==', ['get', 'class_name'], 'Sand'],
                1,
                ['==', ['get', 'class_name'], 'Seagrass'],
                1,
                ['==', ['get', 'class_name'], 'Rubble'],
                1,
                ['==', ['get', 'class_name'], 'Benthic Microalgae'],
                1,
                ['==', ['get', 'class_name'], 'Rock'],
                1,
                ['==', ['get', 'class_name'], 'Coral/Algae'],
                1,
                0 // Default / other
              ];
        scope.fillGeomorphicOpacityExpression =
          fillGeomorphicOpacityValue === 0 || fillGeomorphicOpacityValue
            ? fillGeomorphicOpacityValue
            : [
                'case',
                ['==', ['get', 'class_name'], 'Back Reef Slope'],
                1,
                ['==', ['get', 'class_name'], 'Deep Lagoon'],
                1,
                ['==', ['get', 'class_name'], 'Inner Reef Flat'],
                1,
                ['==', ['get', 'class_name'], 'Outer Reef Flat'],
                1,
                ['==', ['get', 'class_name'], 'Patch Reefs'],
                1,
                ['==', ['get', 'class_name'], 'Plateau'],
                1,
                ['==', ['get', 'class_name'], 'Reef Crest'],
                1,
                ['==', ['get', 'class_name'], 'Reef Slope'],
                1,
                ['==', ['get', 'class_name'], 'Shallow Lagoon'],
                1,
                ['==', ['get', 'class_name'], 'Sheltered Reef Slope'],
                1,
                ['==', ['get', 'class_name'], 'Small Reef'],
                1,
                ['==', ['get', 'class_name'], 'Terrestrial Reef Flat'],
                1,
                0 // Default / other
              ];

        scope.rasterOpacityExpression =
          rasterOpacityValue === 0 || rasterOpacityValue
            ? rasterOpacityValue
            : 1;

        const map = new mapboxgl.Map({
          container: element[0],
          style: worldBaseMap,
          center: defaultCenter, // starting position [lng, lat]
          zoom: defaultZoom, // starting zoom
          maxZoom: 16,
          attributionControl: true,
          customAttribution:
            'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community &copy; <a href="http://www.allencoralatlas.org/">2019 Allen Coral Atlas Partnership and Vulcan, Inc.</a>'
        });

        const loadMapSources = function() {
          map.addSource('atlas-planet', {
            type: 'raster',
            tiles: [
              'https://integration.allencoralatlas.org/tiles/planet/visual/2019/{z}/{x}/{y}'
            ]
          });

          map.addSource('atlas-benthic', {
            type: 'vector',
            tiles: [
              'https://integration.allencoralatlas.org/tiles/benthic/{z}/{x}/{y}'
            ],
            minZoom: 0,
            maxZoom: 22
          });

          map.addSource('atlas-geomorphic', {
            type: 'vector',
            tiles: [
              'https://integration.allencoralatlas.org/tiles/geomorphic/{z}/{x}/{y}'
            ],
            minZoom: 0,
            maxZoom: 22
          });

          map.addLayer({
            id: 'atlas-planet',
            type: 'raster',
            source: 'atlas-planet',
            'source-layer': 'planet',
            paint: {
              'raster-opacity': scope.rasterOpacityExpression
            }
          });

          map.addLayer({
            id: 'atlas-benthic',
            type: 'fill',
            source: 'atlas-benthic',
            'source-layer': 'benthic',
            paint: {
              'fill-color': [
                'case',
                ['==', ['get', 'class_name'], 'Coral/Algae'],
                'rgb(255, 97, 97)',
                ['==', ['get', 'class_name'], 'Benthic Microalgae'],
                'rgb(155, 204, 79)',
                ['==', ['get', 'class_name'], 'Rock'],
                'rgb(177, 156, 58)',
                ['==', ['get', 'class_name'], 'Rubble'],
                'rgb(224, 208, 94)',
                ['==', ['get', 'class_name'], 'Sand'],
                'rgb(254, 254, 190)',
                ['==', ['get', 'class_name'], 'Seagrass'],
                'rgb(102, 132, 56)',
                'rgb(201, 65, 216)' // Default / other
              ],
              'fill-opacity': scope.fillOpacityExpression
            }
          });

          map.addLayer({
            id: 'atlas-geomorphic',
            type: 'fill',
            source: 'atlas-geomorphic',
            'source-layer': 'geomorphic',
            paint: {
              'fill-color': [
                'case',
                ['==', ['get', 'class_name'], 'Back Reef Slope'],
                'rgb(190, 251, 255)',
                ['==', ['get', 'class_name'], 'Deep Lagoon'],
                'rgb(44, 162, 249)',
                ['==', ['get', 'class_name'], 'Inner Reef Flat'],
                'rgb(197, 167, 203)',
                ['==', ['get', 'class_name'], 'Outer Reef Flat'],
                'rgb(146, 115, 157)',
                ['==', ['get', 'class_name'], 'Patch Reefs'],
                'rgb(255, 186, 21)',
                ['==', ['get', 'class_name'], 'Plateau'],
                'rgb(205, 104, 18)',
                ['==', ['get', 'class_name'], 'Reef Crest'],
                'rgb(97, 66, 114)',
                ['==', ['get', 'class_name'], 'Reef Slope'],
                'rgb(40, 132, 113)',
                ['==', ['get', 'class_name'], 'Shallow Lagoon'],
                'rgb(119, 208, 252)',
                ['==', ['get', 'class_name'], 'Sheltered Reef Slope'],
                'rgb(16, 189, 166)',
                ['==', ['get', 'class_name'], 'Small Reef'],
                'rgb(230, 145, 19)',
                ['==', ['get', 'class_name'], 'Terrestrial Reef Flat'],
                'rgb(251, 222, 251)',
                'rgb(201, 65, 216)' // Default / other
              ],
              'fill-opacity': scope.fillGeomorphicOpacityExpression
            }
          });
        };

        map.on('load', function() {
          loadMapSources();
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
                applyOpacityExpression(storageVal)
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
                applyOpacityExpression(storageVal)
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
