/* globals L */

/*
  REQUIRED:

  widgetForm = form name
  widgetLat = latitude model value
  widgetLng = longitude model value

  OPTIONAL:

  Example:

  <div
    geopoint
    widget-form="form"
    widget-lat="site.latitude"
    widget-lng="site.longitude"
  ></div>

*/

angular.module('mermaid.libs').directive('geopoint', [
  'leafletData',
  function(leafletData) {
    'use strict';
    return {
      scope: {
        widgetForm: '=',
        widgetLat: '=',
        widgetLng: '='
      },
      templateUrl: 'app/_mermaid_common/forms/directives/geopoint.tpl.html',

      link: function(scope) {
        scope.markerLat = null;
        scope.markerLng = null;
        L.Icon.Default.imagePath = 'styles/css/images';

        var init = true;
        var zoomLevel = 12;
        function addMarker(latitude, longitude) {
          scope.markers = {
            marker: {
              lat: latitude,
              lng: longitude,
              draggable: true
            }
          };
          scope.events = {
            markers: {
              enable: ['dragend', 'dragstart']
            }
          };
          if (init) {
            scope.map.panTo([latitude, longitude]);
            init = false;
          }
        }

        function wrapNum(x, range, includeMax) {
          var max = range[1],
            min = range[0],
            d = max - min;
          return x === max && includeMax
            ? x
            : ((((x - min) % d) + d) % d) + min;
        }

        function normalizeLng(lng) {
          if (lng < -180 || lng > 180) {
            return wrapNum(lng, [-180, 180], true);
          }
          return lng;
        }

        var setCoordinates = function(lat, lng) {
          scope.widgetLat = lat;
          scope.widgetLng = normalizeLng(lng);
          scope.markerLat = lat;
          scope.markerLng = lng;
          scope.markers.marker.lat = lat;
          if (normalizeLng(scope.markers.marker.lng) !== lng) {
            scope.markers.marker.lng = lng;
            scope.map.setView([lat, lng], zoomLevel);
          }
        };

        scope.$watchGroup(['widgetLat', 'widgetLng', 'map'], function(n) {
          if (n[0] == null || n[1] == null || n[2] == null) {
            return;
          }

          if (_.isNaN(n[0]) || _.isNaN(n[1])) {
            return;
          }

          if (!scope.markers.marker) {
            addMarker(n[0], n[1]);
          } else {
            setCoordinates(n[0], n[1]);
          }
        });

        leafletData.getMap().then(function(map) {
          scope.map = map;
          scope.map.options.minZoom = 2;
          scope.map.options.maxZoom = 17;
          scope.map.attributionControl.setPrefix('');
          leafletData.getLayers().then(function() {
            scope.map.on('draw:created', function(e) {
              scope.widgetForm.$setDirty();
              var layer = e.layer;
              var lat = layer._latlng.lat;
              var lng = layer._latlng.lng;
              addMarker(lat, lng);
              setCoordinates(lat, lng);
            });
          });
        });

        scope.$on('leafletDirectiveMarker.dragend', function(event, args) {
          scope.widgetForm.$setDirty();
          setCoordinates(args.model.lat, args.model.lng);
        });

        var drawControlOptions = {
          draw: {
            circle: false,
            polyline: false,
            polygon: false,
            rectangle: false
          }
        };

        var drawControl = new L.Control.Draw(drawControlOptions);

        angular.extend(scope, {
          controls: {
            custom: [drawControl]
          },
          layers: {
            baselayers: {
              esriSatellite: {
                name: 'Satellite',
                url:
                  '//server.arcgisonline.com/ArcGIS/rest/services' +
                  '/World_Imagery/MapServer/tile/{z}/{y}/{x}',
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
          markers: {},
          events: {},
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
