/* globals mapboxgl */

angular.module('mermaid.libs').directive('mapboxGl', [
  function() {
    'use strict';
    return {
      restrict: 'EA',
      transclude: true,
      scope: {
        mapopts: '=?',
        records: '=?',
        geoattr: '=?'
      },
      template:
        '<div id="map" class="row" style="height: 400px;"><legend-slider></legend-slider>',
      link: function(scope) {
        scope.benthicLayerColors = {
          Deep: 'rgb(225, 225, 225)',
          Land: 'rgb(61, 166, 27)',
          Sand: 'rgb(255, 255, 190)',
          Seagrass: 'rgb(102, 132, 56)',
          Rubble: 'rgb(224, 208, 94)',
          Unknown: 'rgb(178, 178, 178)',
          'Microalgal Mats': 'rgb(155, 204, 79)',
          Rock: 'rgb(177, 156, 58)',
          'Coral/Alage': 'rgb(255, 97, 97)',
          Default: 'rgb(201, 65, 216)'
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

        const applyOpacityExpression = function(array) {
          if (array === null) {
            return false;
          }

          const arrayExp = array.flatMap(item => {
            let equalBenthic = [['==', ['get', 'benthic']], 1];
            equalBenthic[0].push(item);

            return equalBenthic;
          });

          arrayExp.unshift('case');
          arrayExp.push(0);
          return array.length > 0 ? arrayExp : 0;
        };

        scope.mapopts = scope.mapopts || {};
        scope.records = scope.records || [];
        scope.geoattr = scope.geoattr || 'location';
        scope.fillOpacityExpression = applyOpacityExpression(
          JSON.parse(localStorage.getItem('benthic_legend'))
        ) || [
          'case',
          ['==', ['get', 'benthic'], 'Deep'],
          1,
          ['==', ['get', 'benthic'], 'Land'],
          1,
          ['==', ['get', 'benthic'], 'Sand'],
          1,
          ['==', ['get', 'benthic'], 'Seagrass'],
          1,
          ['==', ['get', 'benthic'], 'Rubble'],
          1,
          ['==', ['get', 'benthic'], 'Unknown'],
          1,
          ['==', ['get', 'benthic'], 'Microalgal Mats'],
          1,
          ['==', ['get', 'benthic'], 'Rock'],
          1,
          ['==', ['get', 'benthic'], 'Coral/Alage'],
          1,
          0 // Default / other
        ];

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

          mapBox.addSource('atlas-benthic', {
            type: 'vector',
            tiles: [
              'http://34.83.20.4:8080/geoserver/gwc/service/tms/1.0.0/coral-atlas:reef_polygons_benthic_expanded@EPSG:900913@pbf/{z}/{x}/{y}.pbf'
            ],
            scheme: 'tms',
            minZoom: 0,
            maxZoom: 24
          });

          mapBox.addLayer({
            id: 'atlas-benthic',
            type: 'fill',
            source: 'atlas-benthic',
            'source-layer': 'reef_polygons_benthic_expanded',
            paint: {
              'fill-color': [
                'case',
                ['==', ['get', 'benthic'], 'Deep'],
                'rgb(225, 225, 225)',
                ['==', ['get', 'benthic'], 'Land'],
                'rgb(61, 166, 27)',
                ['==', ['get', 'benthic'], 'Sand'],
                'rgb(254, 254, 190)',
                ['==', ['get', 'benthic'], 'Seagrass'],
                'rgb(145, 198, 3)',
                ['==', ['get', 'benthic'], 'Rubble'],
                'rgb(224, 208, 94)',
                ['==', ['get', 'benthic'], 'Unknown'],
                'rgb(178, 178, 178)',
                ['==', ['get', 'benthic'], 'Microalgal Mats'],
                'rgb(155, 204, 79)',
                ['==', ['get', 'benthic'], 'Rock'],
                'rgb(177, 156, 58)',
                ['==', ['get', 'benthic'], 'Coral/Alage'],
                'rgb(255, 97, 97)',
                'rgb(201, 65, 216)' // Default / other
              ],
              'fill-opacity': scope.fillOpacityExpression
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
              const results = mapBox.querySourceFeatures('atlas-benthic', {
                sourceLayer: 'reef_polygons_benthic_expanded'
              });

              if (results.length > 0) {
                const benthicProperties = results.map(value => {
                  return value.properties.benthic;
                });

                scope.benthicLegends = [...new Set(benthicProperties)];
              }
            }

            if (scope.records.length > 0) {
              mapBox.fitBounds(bounds, { padding: 50, animate: false });
            }
          },
          true
        );

        scope.$watch(
          function() {
            return localStorage.getItem('benthic_legend');
          },
          function(newVal, oldVal) {
            const storageOption = JSON.parse(newVal);
            if (newVal !== oldVal) {
              mapBox.setPaintProperty(
                'atlas-benthic',
                'fill-opacity',
                applyOpacityExpression(storageOption)
              );
            }
          }
        );
      }
    };
  }
]);
