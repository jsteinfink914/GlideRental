// Google Maps Loader
// This script handles loading the Google Maps JavaScript API

// Store the promise in a global variable
let googleMapsPromise: Promise<typeof google.maps> | null = null;

export async function loadGoogleMaps(): Promise<typeof google.maps> {
  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise<typeof google.maps>((resolve, reject) => {
    // First get the API key from the server
    fetch('/api/maps-key')
      .then(response => response.json())
      .then(data => {
        const apiKey = data.key;
        
        if (!apiKey) {
          reject(new Error('Google Maps API key not found'));
          return;
        }

        // Create script element
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        
        // Set up callbacks
        window.initMap = () => {
          if (window.google && window.google.maps) {
            resolve(window.google.maps);
          } else {
            reject(new Error('Google Maps failed to load'));
          }
        };

        script.addEventListener('load', () => window.initMap());
        script.addEventListener('error', (e) => {
          reject(new Error(`Google Maps script failed to load: ${e}`));
        });

        // Add script to document
        document.head.appendChild(script);
      })
      .catch(error => {
        reject(new Error(`Failed to fetch Google Maps API key: ${error.message}`));
      });
  });

  return googleMapsPromise;
}

// Add necessary types
declare global {
  interface Window {
    google: typeof google;
    initMap: () => void;
  }
}