
import mapboxgl from 'mapbox-gl';

// Default map styles
export const MAP_STYLES = {
  LIGHT: 'mapbox://styles/mapbox/light-v11',
  DARK: 'mapbox://styles/mapbox/dark-v11',
  STREETS: 'mapbox://styles/mapbox/streets-v12',
  OUTDOORS: 'mapbox://styles/mapbox/outdoors-v12',
  SATELLITE: 'mapbox://styles/mapbox/satellite-streets-v12'
};

// Default locations
export const DEFAULT_LOCATIONS = {
  USA: {
    center: [-98.5795, 39.8283],
    zoom: 3.5,
    pitch: 30,
    bearing: 0
  },
  NEW_YORK: {
    center: [-73.9857, 40.7484],
    zoom: 12,
    pitch: 45,
    bearing: 0
  },
  LOS_ANGELES: {
    center: [-118.2437, 34.0522],
    zoom: 12,
    pitch: 45,
    bearing: 0
  },
  CHICAGO: {
    center: [-87.6298, 41.8781],
    zoom: 12,
    pitch: 45,
    bearing: 0
  }
};

// Create a marker with custom color
export function createMarker(
  map: mapboxgl.Map, 
  coordinates: [number, number], 
  color: string = '#1F77B4',
  popup?: mapboxgl.Popup
): mapboxgl.Marker {
  const markerElement = document.createElement('div');
  markerElement.className = 'custom-marker';
  markerElement.style.width = '20px';
  markerElement.style.height = '20px';
  markerElement.style.borderRadius = '50%';
  markerElement.style.backgroundColor = color;
  markerElement.style.border = '2px solid white';
  markerElement.style.boxShadow = '0 0 4px rgba(0,0,0,0.4)';
  
  const marker = new mapboxgl.Marker(markerElement)
    .setLngLat(coordinates)
    .addTo(map);
    
  if (popup) {
    marker.setPopup(popup);
  }
  
  return marker;
}

// Create a popup with custom HTML content
export function createPopup(
  html: string,
  options: mapboxgl.PopupOptions = {}
): mapboxgl.Popup {
  return new mapboxgl.Popup({
    closeButton: true,
    closeOnClick: true,
    maxWidth: '300px',
    ...options
  }).setHTML(html);
}

// Add a 3D building layer to the map
export function add3DBuildings(map: mapboxgl.Map): void {
  // Wait until the map is loaded
  map.on('load', () => {
    // Add 3D building layer if it doesn't exist
    if (!map.getLayer('3d-buildings')) {
      // Check if the style has the building layer
      const layers = map.getStyle().layers;
      let labelLayerId;
      for (let i = 0; i < layers.length; i++) {
        if (layers[i].type === 'symbol' && layers[i].layout && layers[i].layout['text-field']) {
          labelLayerId = layers[i].id;
          break;
        }
      }
      
      map.addLayer({
        'id': '3d-buildings',
        'source': 'composite',
        'source-layer': 'building',
        'filter': ['==', 'extrude', 'true'],
        'type': 'fill-extrusion',
        'minzoom': 14,
        'paint': {
          'fill-extrusion-color': '#aaa',
          'fill-extrusion-height': [
            'interpolate', ['linear'], ['zoom'],
            15, 0,
            16, ['get', 'height']
          ],
          'fill-extrusion-base': [
            'interpolate', ['linear'], ['zoom'],
            15, 0,
            16, ['get', 'min_height']
          ],
          'fill-extrusion-opacity': 0.6
        }
      }, labelLayerId);
    }
  });
}

// Add a heatmap layer to the map
export function addHeatmapLayer(
  map: mapboxgl.Map, 
  sourceId: string, 
  layerId: string, 
  data: GeoJSON.FeatureCollection
): void {
  map.addSource(sourceId, {
    'type': 'geojson',
    'data': data
  });
  
  map.addLayer({
    'id': layerId,
    'type': 'heatmap',
    'source': sourceId,
    'paint': {
      // Increase weight as diameter increases
      'heatmap-weight': ['interpolate', ['linear'], ['get', 'value'], 0, 0, 10, 1],
      // Increase intensity as zoom level increases
      'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
      // Assign color values to heatmap
      'heatmap-color': [
        'interpolate', ['linear'], ['heatmap-density'],
        0, 'rgba(0, 0, 255, 0)',
        0.2, 'rgb(0, 0, 255)',
        0.4, 'rgb(0, 255, 255)',
        0.6, 'rgb(0, 255, 0)',
        0.8, 'rgb(255, 255, 0)',
        1, 'rgb(255, 0, 0)'
      ],
      // Adjust radius with zoom
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 9, 20],
      // Decrease opacity with zoom
      'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 1, 9, 0.5]
    }
  });
}
