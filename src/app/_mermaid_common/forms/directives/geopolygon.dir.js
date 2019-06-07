/* globals L */

/*
  REQUIRED:

  widget-form: form name
  widget-polygon: polygon coordinates
  widget-size: for area calculation to a related object in the view

  Example:

  <div
    geopolygon
    widget-form="form"
    widget-polygon="geojson.data"
    widget-size="management.size"
  ></div>

*/

angular.module('mermaid.libs').directive('geopolygon', [
  'leafletData',
  function(leafletData) {
    'use strict';
    return {
      scope: {
        widgetForm: '=',
        widgetPolygon: '=',
        widgetSize: '=?'
      },
      templateUrl: 'app/_mermaid_common/forms/directives/geopolygon.tpl.html',

      link: function(scope) {
        var drawnItems = new L.FeatureGroup();

        var updateSizeAndLayer = function(layer) {
          scope.widgetSize = Math.trunc(
            L.GeometryUtil.geodesicArea(layer.getLatLngs()) / 1000000
          );
          scope.widgetForm.$setDirty();
          var layer_geom = layer.toGeoJSON();
          scope.widgetPolygon = {
            type: 'MultiPolygon',
            coordinates: [[layer_geom.geometry.coordinates[0]]]
          };
        };

        var southWest = L.latLng(-90, -180);
        var northEast = L.latLng(90, 180);
        var bounds = L.latLngBounds(southWest, northEast);

        leafletData.getMap().then(function(map) {
          scope.map = map;
          scope.map.setMaxBounds(bounds);
          scope.map.options.minZoom = 2;
          scope.map.options.maxZoom = 17;
          scope.map.attributionControl.setPrefix('');
          scope.map.addLayer(drawnItems);
          leafletData.getLayers().then(function() {
            scope.map
              .on('draw:created', function(e) {
                var layer = e.layer;
                layer.addTo(drawnItems);
                updateSizeAndLayer(layer);
                scope.drawControlFull.removeFrom(map);
                scope.drawControlEditOnly.addTo(map);
                scope.un = true;
              })
              .on('draw:editvertex', function(e) {
                var layers = e.layers;
                layers.eachLayer(function(layer) {
                  if (!scope.map.options.maxBounds.contains([layer._latlng])) {
                    var toolbar;
                    for (var toolbarId in scope.drawControlEditOnly._toolbars) {
                      toolbar = scope.drawControlEditOnly._toolbars[toolbarId];
                      if (toolbar instanceof L.EditToolbar) {
                        toolbar._modes.edit.handler.revertLayers();
                        toolbar._modes.edit.handler.disable();
                      }
                    }
                  }
                });
              })
              .on('draw:edited', function(e) {
                var layers = e.layers;
                layers.eachLayer(function(layer) {
                  updateSizeAndLayer(layer);
                });
              })
              .on('draw:deleted', function() {
                if (drawnItems.getLayers().length === 0) {
                  scope.widgetForm.$setDirty();
                  scope.widgetSize = null;
                  scope.widgetPolygon = null;
                  scope.drawControlEditOnly.removeFrom(map);
                  scope.drawControlFull.addTo(map);
                }
              })
              .on('drag', function() {
                map.panInsideBounds(bounds, {
                  animate: false
                });
              });
          });
        });

        function squareKm_to_squareM(geom) {
          var squareKm = L.GeometryUtil.geodesicArea(geom.getLatLngs()[0]);
          var squareM = squareKm / 1000000;
          return squareM;
        }

        scope.$watch('widgetPolygon', function(n, o) {
          if (n === o || n === null || scope.un) {
            return;
          }
          scope.un = true;
          var area_obj = L.GeoJSON.geometryToLayer(scope.widgetPolygon);
          area_obj.getLayers()[0].addTo(drawnItems);
          if (scope.map._layers != null) {
            scope.drawControlFull.removeFrom(scope.map);
            scope.drawControlEditOnly.addTo(scope.map);
          }
          scope.map.fitBounds(area_obj.getBounds());
          scope.widgetSize = Math.trunc(squareKm_to_squareM(area_obj));
        });

        var drawControlOptions = {
          draw: {
            circle: false,
            marker: false,
            polyline: false,
            rectangle: false,
            polygon: {
              allowIntersection: false,
              drawError: {
                color: '#e1e100',
                message: '<strong>Only non-interesction polygons<strong>'
              }
            }
          }
        };

        scope.drawControlFull = new L.Control.Draw(drawControlOptions);

        scope.drawControlEditOnly = new L.Control.Draw({
          edit: {
            featureGroup: drawnItems
          },
          draw: false
        });

        angular.extend(scope, {
          controls: {
            custom: [scope.drawControlFull]
          },
          layers: {
            baselayers: {
              esriSatellite: {
                name: 'Satellite',
                url:
                  '//server.arcgisonline.com/ArcGIS/rest/services/' +
                  'World_Imagery/MapServer/tile/{z}/{y}/{x}',
                type: 'xyz',
                layerOptions: {
                  attribution: 'Basemap &copy; esri'
                },
                layerParams: {
                  showOnSelector: true
                }
              },
              osm: {
                name: 'Street Map',
                url: '//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                type: 'xyz',
                layerOptions: {
                  subdomains: ['a', 'b', 'c'],
                  attribution: 'Basemap &copy; OpenStreetMap'
                },
                layerParams: {
                  showOnSelector: true
                }
              }
            },
            overlays: {
              draw: {
                name: 'draw',
                type: 'group',
                visible: true,
                layerParams: {
                  showOnSelector: false
                }
              }
            }
          },
          geojson: {
            data: null,
            style: {
              fillColor: '#CBBA7E',
              weight: 1,
              opacity: 1,
              color: '#DDA93E',
              fillOpacity: 0.7
            }
          },
          center: {
            lat: 0,
            lng: 0,
            zoom: 2
          }
        });
      }
    };
  }
]);
