import { useState, useCallback } from 'react';
import { Property } from '@shared/schema';

interface MapState {
  center: { lat: number; lng: number };
  zoom: number;
  selectedProperty: Property | null;
}

export function useMap() {
  const [mapState, setMapState] = useState<MapState>({
    center: { lat: 40.7128, lng: -74.0060 }, // New York City coordinates
    zoom: 12,
    selectedProperty: null,
  });

  const selectProperty = useCallback((property: Property) => {
    // In a real implementation, we would get coordinates from the property
    // For now, we'll just update the selected property
    setMapState(prevState => ({
      ...prevState,
      selectedProperty: property
    }));
  }, []);

  const clearSelectedProperty = useCallback(() => {
    setMapState(prevState => ({
      ...prevState,
      selectedProperty: null
    }));
  }, []);

  const setCenter = useCallback((lat: number, lng: number) => {
    setMapState(prevState => ({
      ...prevState,
      center: { lat, lng }
    }));
  }, []);

  const setZoom = useCallback((zoom: number) => {
    setMapState(prevState => ({
      ...prevState,
      zoom
    }));
  }, []);

  return {
    mapState,
    selectProperty,
    clearSelectedProperty,
    setCenter,
    setZoom
  };
}
