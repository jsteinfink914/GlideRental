import { writable, get } from 'svelte/store';
import Papa from 'papaparse';


export const allListings = writable([]); // Holds the full dataset
export const listings = writable([]);
export const favorites = writable([]);
export const selectedAttributes = writable(['price', 'sqft', 'beds', 'baths', 'photo']);
export const userPreferences = writable({
  grocery: '',
  gym: '',
  poiTypes: [] // Array to store selected Points of Interest
});


async function fetchListingsFromCSV() {
  const url = '/nyc_listings.csv'; // Ensure this path is correct

  try {
      const response = await fetch(url);
      const text = await response.text();
      const data = parseCSV(text);
      allListings.set(data);
      listings.set(data);
      console.log("✅ Listings loaded from CSV:", data);
  } catch (error) {
      console.error("🚨 Error fetching listings from CSV:", error);
  }
}

/**
* Parse CSV data into an array of objects
*/
function parseCSV(csvText) {
  const rows = csvText.trim().split("\n").map(row => row.split(","));
  
  console.log("🛠️ Raw CSV Data:", rows);

  return rows
      .slice(1) // Skip the header row
      .filter(row => row.length >= 8 && row.some(cell => cell.trim() !== "")) // Ignore empty rows
      .map(row => ({
          id: row[0].trim(),
          address: row[1].replace(/^"|"$/g, '').trim(), // Remove surrounding quotes
          price: parseFloat(row[2]) || 0,
          beds: parseInt(row[3]) || 0,
          baths: parseFloat(row[4]) || 0,
          sqft: parseInt(row[5]) || 0,
          lat: parseFloat(row[6]) || null,
          lon: parseFloat(row[7]) || null,
          photo: row[8] ? row[8].trim() : ""
      }));
}


fetchListingsFromCSV(); // Load listings on startup

/**
 * Toggle a listing as a favorite
 */
export function toggleFavorite(listing) {
  favorites.update(favs => {
    const exists = favs.some(fav => fav.address === listing.address);
    const updatedFavs = exists
      ? favs.filter(fav => fav.address !== listing.address)
      : [...favs, { ...listing }];

    console.log("❤️ Updated Favorites:", updatedFavs);
    return [...updatedFavs];  // ✅ Forces Svelte reactivity
  });
}


/**
 * Extract selected attributes for comparison
 */
export function getCompareData() {
  const favs = get(favorites);
  const attrs = get(selectedAttributes);
  const updatedListings = get(listings);

  return favs.map(fav => {
      const updatedListing = updatedListings.find(l => l.id === fav.id) || fav;
      return {
        ...updatedListing,  // Copies all attributes from the listing
        nearestGrocery: updatedListing.nearestGrocery || { name: 'N/A', distance: 'N/A' },
        nearestGym: updatedListing.nearestGym || { name: 'N/A', distance: 'N/A' }
          };
      });
  }





/**
 * Search for nearest place using Google Places API
 */
export async function findNearestPlace(listing, type, keyword) {
  try {
      const url = `/api/places?lat=${listing.lat}&lon=${listing.lon}&type=${type}&keyword=${encodeURIComponent(keyword)}&t=${Date.now()}`;
      console.log("Fetching from:", url);
      const response = await fetch(url, { cache: 'no-store' });
      const data = await response.json();
      console.log(`Response for ${type} (${keyword}) at ${listing.address}:`, data);
      
      if (data.results && data.results.length > 0) {
        const sortedResults = data.results.sort((a, b) => {
          const distA = haversineDistance(listing.lat, listing.lon, a.geometry.location.lat, a.geometry.location.lng);
          const distB = haversineDistance(listing.lat, listing.lon, b.geometry.location.lat, b.geometry.location.lng);
          return distA - distB; // Smallest distance first
      });
      const nearest = sortedResults[0]; // Pick closest
      const distance = haversineDistance(listing.lat, listing.lon, nearest.geometry.location.lat, nearest.geometry.location.lng);

      console.log(`✅ Closest ${type} for ${listing.address}: ${nearest.name} (${distance.toFixed(2)} mi)`);
      return {
        name: nearest.name,
        lat: nearest.geometry.location.lat,
        lon: nearest.geometry.location.lng,
        distance: `${distance.toFixed(2)} mi`
    };
  }else {
      console.warn(`⚠️ No ${type} found near ${listing.address}`);
      }
  } catch (error) {
      console.error(`🚨 Error finding ${keyword}:`, error);
  }
  return null;
}


export async function updateUserPreferences(preferences) {
  console.log("updateUserPreferences called with:", preferences);
   // Set default empty values if missing
   const updatedPreferences = {
    grocery: preferences.grocery || '',
    gym: preferences.gym || '',
    poiTypes: preferences.poiTypes || []
};

userPreferences.set(updatedPreferences);
  if (!preferences.grocery || !preferences.gym) {
      console.warn("⚠️ Grocery store or gym preference is missing.");
      return;
  }

  console.log(`🌍 Finding nearest locations for grocery: ${preferences.grocery} and gym: ${preferences.gym}`);

  // Check if listings are loaded
  const currentListings = get(listings);
  if (currentListings.length === 0) {
      console.warn("⚠️ Listings not yet loaded. Retrying in 1 second...");
      setTimeout(() => updateUserPreferences(preferences), 1000);
      return;
  }

  // Update each listing with its nearest grocery and gym locations
  const updatedListings = await Promise.all(
      currentListings.map(async (listing, index) => {
          console.log(`Updating listing #${index} (${listing.address})`);
          const nearestGrocery = await findNearestPlace(listing, "supermarket", preferences.grocery);
          if (nearestGrocery) {
              const distance = haversineDistance(listing.lat, listing.lon, nearestGrocery.lat, nearestGrocery.lon);
              listing.nearestGrocery = { ...nearestGrocery, distance: distance.toFixed(2) + " mi" };
          } else {
              listing.nearestGrocery = null;
          }

          const nearestGym = await findNearestPlace(listing, "gym", preferences.gym);
          if (nearestGym) {
              const distance = haversineDistance(listing.lat, listing.lon, nearestGym.lat, nearestGym.lon);
              listing.nearestGym = { ...nearestGym, distance: distance.toFixed(2) + " mi" };
          } else {
              listing.nearestGym = null;
              console.warn(`No nearest gym found for ${listing.address}`);
          }
          if (preferences.poiTypes && preferences.poiTypes.length > 0) {
            listing.nearestPOIs = {};
            for (const poiType of preferences.poiTypes) {
                const nearestPOI = await findNearestPlace(listing, poiType.toLowerCase(), poiType);
                if (nearestPOI) {
                    listing.nearestPOIs[poiType] = { ...nearestPOI };
                }
            }
        }

          return listing;
      })
  );

  listings.set(updatedListings);
  console.log(`✅ Updated listings with nearest grocery and gym`, updatedListings);
  return updatedListings;
}




function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * 
      Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
