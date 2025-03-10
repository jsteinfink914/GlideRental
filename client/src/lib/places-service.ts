// Places Service for nearby POI search
import { Property } from "@shared/schema";

export interface POI {
  name: string;
  lat: number;
  lng: number; // Using lng instead of lon to match Google Maps API
  distance: string;
  rating?: number;
}

/**
 * Calculates distance between two coordinates using Haversine formula
 */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Finds the nearest place of interest for a property
 * @param property Property location
 * @param type Type of place (e.g., 'grocery', 'gym')
 * @param keyword Specific search term (e.g., 'Whole Foods', 'Equinox')
 */
export async function findNearestPlace(
  property: Property,
  type: string,
  keyword: string
): Promise<POI | null> {
  if (!property.latitude || !property.longitude) {
    console.warn("Property missing coordinates", property);
    return null;
  }

  try {
    // Call our server-side API to avoid exposing Google API key on client
    const response = await fetch(
      `/api/nearby-places?lat=${property.latitude}&lng=${property.longitude}&type=${type}&keyword=${encodeURIComponent(
        keyword
      )}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();
    console.log(`Places API response for ${type} (${keyword}):`, data);

    if (!data.places || data.places.length === 0) {
      console.warn(`No ${type} found near ${property.address}`);
      return null;
    }

    // Return the first result (our API should already sort by distance)
    const place = data.places[0];
    const distance = haversineDistance(
      property.latitude,
      property.longitude,
      place.lat,
      place.lng
    );

    return {
      name: place.name,
      lat: place.lat,
      lng: place.lng,
      distance: `${distance.toFixed(2)} mi`,
      rating: place.rating
    };
  } catch (error) {
    console.error(`Error finding nearest ${type} (${keyword}):`, error);
    return null;
  }
}

/**
 * Update property with POI info for multiple places
 */
export async function enrichPropertyWithPOIs(
  property: Property,
  preferredGrocery: string,
  preferredGym: string,
  poiTypes: string[] = []
): Promise<Property & { 
  nearestGrocery?: POI;
  nearestGym?: POI;
  nearestPOIs?: Record<string, POI>;
}> {
  const enrichedProperty = { ...property };
  
  // Find nearest grocery store
  if (preferredGrocery) {
    enrichedProperty.nearestGrocery = await findNearestPlace(
      property,
      'supermarket', 
      preferredGrocery
    );
  }
  
  // Find nearest gym
  if (preferredGym) {
    enrichedProperty.nearestGym = await findNearestPlace(
      property,
      'gym',
      preferredGym
    );
  }
  
  // Find other POIs if requested
  if (poiTypes.length > 0) {
    enrichedProperty.nearestPOIs = {};
    
    for (const poiType of poiTypes) {
      const poi = await findNearestPlace(
        property,
        poiType.toLowerCase(),
        poiType
      );
      
      if (poi) {
        enrichedProperty.nearestPOIs[poiType] = poi;
      }
    }
  }
  
  return enrichedProperty;
}

/**
 * Get a route between two points
 */
export interface RouteInfo {
  distance: string;
  duration: string;
  route: { lat: number; lng: number }[];
}

export async function calculateRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  mode: 'WALKING' | 'DRIVING' | 'TRANSIT' | 'BICYCLING' = 'WALKING'
): Promise<RouteInfo | null> {
  try {
    const response = await fetch('/api/routes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        origin,
        destination,
        mode
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error calculating route:', error);
    return null;
  }
}