/* globals mapboxgl */

angular.module('mermaid.libs').service('AcaMapService', [
  'localStorageService',
  function(localStorageService) {
    'use strict';

    const satelliteBaseMap = {
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

    const benthicColorExpression = [
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
    ];

    const benthicOpacityExpression = [
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

    const geomorphicColorExpression = [
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
    ];

    const geomorphicOpacityExpression = [
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
    const fillOpacityExpression =
      fillOpacityValue === 0 || fillOpacityValue
        ? fillOpacityValue
        : benthicOpacityExpression;

    const fillGeomorphicOpacityValue = applyOpacityExpression(
      localStorageService.get('geomorphic_legend')
    );
    const fillGeomorphicOpacityExpression =
      fillGeomorphicOpacityValue === 0 || fillGeomorphicOpacityValue
        ? fillGeomorphicOpacityValue
        : geomorphicOpacityExpression;

    const rasterOpacityValue = localStorageService.get('coral_mosaic');
    const rasterOpacityExpression =
      rasterOpacityValue === 0 || rasterOpacityValue ? rasterOpacityValue : 1;

    const setBasicMapControl = function(map) {
      const navigation = new mapboxgl.NavigationControl({
        showCompass: false,
        showZoom: true
      });

      map.addControl(navigation, 'top-left');
      map.dragRotate.disable();
      map.touchZoomRotate.disableRotation();
    };

    const loadMapMarkers = function(map) {
      map.addSource('mapMarkers', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
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

    const loadACALayers = function(map) {
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
          'raster-opacity': rasterOpacityExpression
        }
      });

      map.addLayer({
        id: 'atlas-benthic',
        type: 'fill',
        source: 'atlas-benthic',
        'source-layer': 'benthic',
        paint: {
          'fill-color': benthicColorExpression,
          'fill-opacity': fillOpacityExpression
        }
      });

      map.addLayer({
        id: 'atlas-geomorphic',
        type: 'fill',
        source: 'atlas-geomorphic',
        'source-layer': 'geomorphic',
        paint: {
          'fill-color': geomorphicColorExpression,
          'fill-opacity': fillGeomorphicOpacityExpression
        }
      });
    };

    const setAllLayersPaintProperty = function(map) {
      map.setPaintProperty(
        'atlas-planet',
        'raster-opacity',
        localStorageService.get('coral_mosaic')
      );

      map.setPaintProperty(
        'atlas-geomorphic',
        'fill-opacity',
        applyOpacityExpression(localStorageService.get('geomorphic_legend'))
      );

      map.setPaintProperty(
        'atlas-benthic',
        'fill-opacity',
        applyOpacityExpression(localStorageService.get('benthic_legend'))
      );
    };

    return {
      satelliteBaseMap: satelliteBaseMap,
      applyOpacityExpression: applyOpacityExpression,
      setBasicMapControl: setBasicMapControl,
      loadMapMarkers: loadMapMarkers,
      loadACALayers: loadACALayers,
      setAllLayersPaintProperty: setAllLayersPaintProperty
    };
  }
]);
