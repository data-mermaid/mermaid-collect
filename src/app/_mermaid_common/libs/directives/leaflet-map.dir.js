/* globals L */

angular.module('mermaid.libs').directive('leafletMap', [
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
      link: function(scope, element) {
        var defaultCenter;
        var defaultZoom;
        var style = {
          color: '#ff0000',
          fillColor: '#ff0000',
          opacity: 0.8,
          radius: 4,
          stroke: 1
        };

        var mutedStyle = {
          color: '#2D2D2D',
          fillColor: '#2D2D2D',
          opacity: 0.5,
          radius: 4,
          stroke: 1
        };

        scope.mapopts = scope.mapopts || {};
        scope.records = scope.records || [];
        scope.geoattr = scope.geoattr || 'location';
        scope.maprecords = L.geoJson([], {
          pointToLayer: function(feature, latlng) {
            return new L.circleMarker(latlng, style);
          },
          onEachFeature: function(feature, layer) {
            var featureProperties = feature.properties;
            layer.bindPopup(
              '<a href="#/projects/' +
                featureProperties.project_id +
                '/sites/' +
                featureProperties.id +
                '">' +
                featureProperties.name +
                '</a>' +
                '<div><p>Reef type: <span>' +
                featureProperties.reeftypes +
                '</span></p><p>Reef zone: <span>' +
                featureProperties.reefzones +
                '</span></p><p>Exposure: <span>' +
                featureProperties.reefexposures +
                '</span></p></div>'
            );
          }
        });

        defaultCenter = scope.mapopts.defaultCenter || [20, 0.0];
        defaultZoom = scope.mapopts.defaultZoom || 2;

        scope.secondaryMapRecords = L.geoJson([], {
          pointToLayer: function(feature, latlng) {
            return new L.circleMarker(latlng, mutedStyle);
          }
        });

        element.addClass('mapcanvas');
        scope.map = scope.map || L.map(element[0], scope.mapopts);

        L.tileLayer(
          '//server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          {
            attribution: 'Basemap &copy; esri',
            maxZoom: 18,
            subdomains: ['a', 'b', 'c']
          }
        ).addTo(scope.map);

        scope.map.addLayer(scope.secondaryMapRecords);
        scope.map.addLayer(scope.maprecords);

        scope.$watch(
          'records',
          function() {
            var center = defaultCenter;
            scope.maprecords.clearLayers();
            _.each(scope.records, function(rec) {
              var rec_geo_data = {
                id: rec.id,
                name: rec.name,
                project_id: scope.mapopts.project_id,
                reefexposures: rec.$$reefexposures.name,
                reeftypes: rec.$$reeftypes.name,
                reefzones: rec.$$reefzones.name
              };
              rec[scope.geoattr].properties = rec_geo_data;
              scope.maprecords.addData(rec[scope.geoattr]);
            });

            var rec_len = scope.records.length;
            if (rec_len < 2) {
              if (rec_len === 1) {
                center = scope.maprecords.getBounds().getCenter();
              }
              scope.map.setView(center, defaultZoom);
            } else {
              scope.map.fitBounds(scope.maprecords.getBounds());
            }
          },
          true
        );

        scope.$watch(
          'secondaryRecords',
          function() {
            scope.secondaryMapRecords.clearLayers();
            _.each(scope.secondaryRecords, function(rec) {
              scope.secondaryMapRecords.addData(rec[scope.geoattr]);
            });
          },
          true
        );
      }
    };
  }
]);
