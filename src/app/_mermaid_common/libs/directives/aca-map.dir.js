/* globals mapboxgl */

angular.module('mermaid.libs').directive('acaMap', [
  'localStorageService',
  'AcaMapService',
  function(localStorageService, AcaMapService) {
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
        scope.mapopts = scope.mapopts || {};
        scope.records = scope.records || [];
        scope.geoattr = scope.geoattr || 'location';

        const defaultCenter = scope.mapopts.defaultCenter || [20, 0.0];
        const defaultZoom = scope.mapopts.defaultZoom || 1;
        const popup = scope.mapopts.popup || false;
        const slider = scope.mapopts.slider || false;

        const controlZoomSettings = {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          textColor: '#ffffff',
          textMessage: 'Use Ctrl + Scroll to zoom the map.',
          timeout: 1500
        };

        const helpElement = document.createElement('div');
        helpElement.id = 'mbgl-gesture-handling-id';
        helpElement.style.backgroundColor = controlZoomSettings.backgroundColor;
        helpElement.style.position = 'absolute';
        helpElement.style.display = 'none';
        helpElement.style.justifyContent = 'center';
        helpElement.style.alignItems = 'center';

        const textBox = document.createElement('div');
        textBox.style.textAlign = 'center';
        textBox.style.color = controlZoomSettings.textColor;
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
          AcaMapService.setBasicMapControl(map);
          AcaMapService.loadACALayers(map);
          AcaMapService.loadMapMarkers(map);
          AcaMapService.setAllLayersPaintProperty(map);

          map.on('wheel', event => {
            if (event.originalEvent.ctrlKey) {
              event.originalEvent.preventDefault();
              hideHelp(map);
              if (!map.scrollZoom._enabled) map.scrollZoom.enable();
            } else {
              if (map.scrollZoom._enabled) {
                map.scrollZoom.disable();
              }
              showHelp(map, controlZoomSettings.textMessage);
              setTimeout(() => {
                hideHelp(map);
              }, controlZoomSettings.timeout);
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
