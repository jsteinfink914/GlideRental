/// <reference types="@types/google.maps" />

// Extend the global window type to include Google Maps
declare global {
  interface Window {
    google: typeof google;
    initMap: () => void;
  }
}