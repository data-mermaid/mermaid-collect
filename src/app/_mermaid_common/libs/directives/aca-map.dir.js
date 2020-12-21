/* globals mapboxgl */

angular.module('mermaid.libs').directive('acaMap', [
  'localStorageService',
  function(localStorageService) {
    'use strict';
    return {
      restrict: 'EA',
      transclude: true,
      scope: {
        mapopts: '=?',
        records: '=?',
        geoattr: '=?'
      },
      link: function(scope, element) {
        const settings = (this.settings = {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          textColor: '#ffffff',
          textMessage: 'Use Ctrl + Scroll to zoom the map.',
          timeout: 1500
        });

        const helpElement = document.createElement('div');
        helpElement.id = 'mbgl-gesture-handling-id';
        helpElement.style.backgroundColor = settings.backgroundColor;
        helpElement.style.position = 'absolute';
        helpElement.style.display = 'none';
        helpElement.style.justifyContent = 'center';
        helpElement.style.alignItems = 'center';

        const textBox = document.createElement('div');
        textBox.style.textAlign = 'center';
        textBox.style.color = settings.textColor;
        textBox.style.fontSize = '2rem';
        textBox.innerText = '';

        helpElement.appendChild(textBox);

        const showHelp = function(map, message) {
          helpElement.style.top = 0;
          helpElement.style.left = 0;
          helpElement.style.width = '100%';
          helpElement.style.height = '100%';
          helpElement.style.display = 'flex';

          helpElement.querySelector('div').innerText = message;

          map.getContainer().appendChild(helpElement);
        };

        const hideHelp = function(map) {
          try {
            map.getContainer().removeChild(helpElement);
          } catch (e) {
            // nothing to do
          }
        };

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

        scope.mapopts = scope.mapopts || {};
        scope.records = scope.records || [];
        scope.geoattr = scope.geoattr || 'location';
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
                ['==', ['get', 'class_name'], 'Shadow Lagoon'],
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

        const defaultCenter = scope.mapopts.defaultCenter || [20, 0.0];
        const defaultZoom = scope.mapopts.defaultZoom || 1;
        const popup = scope.mapopts.popup || false;
        const slider = scope.mapopts.slider || false;
        const navigation = new mapboxgl.NavigationControl({
          showCompass: false,
          showZoom: true
        });

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

        const initLoadMapLayers = function() {
          map.addSource('mapMarkers', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: []
            }
          });

          map.addSource('atlas-planet', {
            type: 'raster',
            tiles: [
              'https://allencoralatlas.org/tiles/planet/visual/2019/{z}/{x}/{y}'
            ]
          });

          map.addSource('atlas-benthic', {
            type: 'vector',
            tiles: ['https://allencoralatlas.org/tiles/benthic/{z}/{x}/{y}'],
            minZoom: 0,
            maxZoom: 22
          });

          map.addSource('atlas-geomorphic', {
            type: 'vector',
            tiles: ['https://allencoralatlas.org/tiles/geomorphic/{z}/{x}/{y}'],
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
                ['==', ['get', 'class_name'], 'Shadow Lagoon'],
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

          map.addLayer({
            id: 'mapMarkers',
            source: 'mapMarkers',
            type: 'circle',
            paint: {
              'circle-radius': 3,
              'circle-color': '#223b53',
              'circle-stroke-color': '#ff0000',
              'circle-stroke-width': 2,
              'circle-opacity': 0.8
            }
          });
        };

        const watchRecords = function(records) {
          const bounds = new mapboxgl.LngLatBounds();
          let data = {
            type: 'FeatureCollection',
            features: []
          };

          _.each(records, function(rec) {
            let rec_geo_data = {};

            if (popup) {
              rec_geo_data = {
                id: rec.id,
                name: rec.name,
                project_id: scope.mapopts.project_id,
                reefexposure: rec.$$reefexposures.name,
                reeftype: rec.$$reeftypes.name,
                reefzone: rec.$$reefzones.name
              };
            }

            const recPoint = {
              type: 'Feature',
              geometry: rec.location,
              properties: rec_geo_data
            };

            bounds.extend(rec.location.coordinates);
            data.features.push(recPoint);
          });

          if (map.getSource('mapMarkers') !== undefined) {
            map.getSource('mapMarkers').setData(data);
          }

          if (records.length > 0) {
            map.fitBounds(bounds, { padding: 25, animate: false });
          }
        };

        map.on('load', function() {
          initLoadMapLayers();
          map.addControl(navigation, 'top-left');

          map.scrollZoom.disable();
          map.dragRotate.disable();
          map.touchZoomRotate.disableRotation();

          map.on('wheel', event => {
            if (event.originalEvent.ctrlKey) {
              event.originalEvent.preventDefault();
              hideHelp(map);
              if (!map.scrollZoom._enabled) map.scrollZoom.enable();
            } else {
              if (map.scrollZoom._enabled) {
                map.scrollZoom.disable();
              }
              showHelp(map, settings.textMessage);
              setTimeout(() => {
                hideHelp(map);
              }, settings.timeout);
            }
          });

          if (popup) {
            map.on('click', 'mapMarkers', function(e) {
              const coordinates = e.features[0].geometry.coordinates.slice();
              const description = popup(e.features[0].properties);

              while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
              }

              new mapboxgl.Popup()
                .setLngLat(coordinates)
                .setHTML(description)
                .addTo(map);
            });

            // Change the cursor to a pointer when the mouse is over the places layer.
            map.on('mouseenter', 'mapMarkers', function() {
              map.getCanvas().style.cursor = 'pointer';
            });

            // Change it back to a pointer when it leaves.
            map.on('mouseleave', 'mapMarkers', function() {
              map.getCanvas().style.cursor = '';
            });
          }

          // define slider: true, and add legendslider directive to use slider
          if (!slider) {
            map.setLayoutProperty('atlas-planet', 'visibility', 'none');
            map.setLayoutProperty('atlas-benthic', 'visibility', 'none');
            map.setLayoutProperty('atlas-geomorphic', 'visibility', 'none');
          }
          scope.$watch('records', watchRecords, true);
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
