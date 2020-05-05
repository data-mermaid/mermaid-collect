/* globals mapboxgl */

angular.module('mermaid.libs').directive('mapboxGl', [
  function() {
    'use strict';
    return {
      restrict: 'EA',
      scope: {
        map: '=?',
        mapopts: '=?',
        records: '=?',
        secondaryRecords: '=?',
        geoattr: '=?'
      },
      link: function(scope) {
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
        const defaultCenter = scope.mapopts.defaultCenter || [20, 0.0];
        const defaultZoom = scope.mapopts.defaultZoom || 1;
        const popup = scope.mapopts.popup || false;
        const navigation = new mapboxgl.NavigationControl({
          showCompass: false,
          showZoom: true
        });

        const mapBox = new mapboxgl.Map({
          container: 'map',
          style: worldBaseMap,
          center: defaultCenter, // starting position [lng, lat]
          zoom: defaultZoom, // starting zoom
          maxZoom: 16
        });

        mapBox.addControl(navigation, 'top-left');

        mapBox.scrollZoom.disable();
        mapBox.dragRotate.disable();
        mapBox.touchZoomRotate.disableRotation();
        mapBox.scrollZoom.setWheelZoomRate(0.02); // Default 1/450

        mapBox.on('wheel', event => {
          if (event.originalEvent.ctrlKey) {
            event.originalEvent.preventDefault();
            hideHelp(mapBox);
            if (!mapBox.scrollZoom._enabled) mapBox.scrollZoom.enable();
          } else {
            if (mapBox.scrollZoom._enabled) {
              mapBox.scrollZoom.disable();
            }
            showHelp(mapBox, settings.textMessage);
            setTimeout(() => {
              hideHelp(mapBox);
            }, settings.timeout);
          }
        });

        mapBox.on('load', function() {
          mapBox.addSource('mapMarkers', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: []
            }
          });

          mapBox.addLayer({
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

          if (popup) {
            mapBox.on('click', 'mapMarkers', function(e) {
              const coordinates = e.features[0].geometry.coordinates.slice();
              const description = popup(e.features[0].properties);

              while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
              }

              new mapboxgl.Popup()
                .setLngLat(coordinates)
                .setHTML(description)
                .addTo(mapBox);
            });

            // Change the cursor to a pointer when the mouse is over the places layer.
            mapBox.on('mouseenter', 'mapMarkers', function() {
              mapBox.getCanvas().style.cursor = 'pointer';
            });

            // Change it back to a pointer when it leaves.
            mapBox.on('mouseleave', 'mapMarkers', function() {
              mapBox.getCanvas().style.cursor = '';
            });
          }
        });

        scope.$watch(
          'records',
          function(records) {
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

            if (mapBox.getSource('mapMarkers') !== undefined) {
              mapBox.getSource('mapMarkers').setData(data);
            }

            if (records.length > 0) {
              mapBox.fitBounds(bounds, { padding: 25, animate: false });
            }
          },
          true
        );
      }
    };
  }
]);
