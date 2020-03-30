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
            if (!mapBox.scrollZoom._enabled) mapBox.scrollZoom.enable();
          } else {
            if (mapBox.scrollZoom._enabled) mapBox.scrollZoom.disable();
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

          mapBox.addSource('secondaryMapMarkers', {
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
          function() {
            const bounds = new mapboxgl.LngLatBounds();
            let data = {
              type: 'FeatureCollection',
              features: []
            };

            _.each(scope.records, function(rec) {
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

            if (scope.records.length > 0) {
              mapBox.fitBounds(bounds, { padding: 50, animate: false });
            }
          },
          true
        );
      }
    };
  }
]);
