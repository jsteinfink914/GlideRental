import { apiRequest } from "./queryClient";

export interface PropertyQuery {
  description: string;
  preferences?: {
    neighborhood?: string;
    priceRange?: { min?: number; max?: number };
    amenities?: string[];
    proximity?: string[];
  };
}

export interface AIPropertySuggestion {
  propertyIds: number[];
  explanation: string;
  relevanceScores: { [propertyId: number]: number };
  highlightedAreas?: { 
    center: { lat: number; lng: number };
    radius: number;
    score: number;
  }[];
}

/**
 * Uses server-side AI to analyze properties and return recommendations
 */
export async function getAIPropertyRecommendations(
  query: PropertyQuery
): Promise<AIPropertySuggestion> {
  const response = await apiRequest("POST", "/api/ai/property-recommendations", query);
  return await response.json();
}

/**
 * Processes natural language location queries using server-side AI
 */
export async function processLocationQuery(
  query: string
): Promise<{
  searchArea?: { center: { lat: number; lng: number }; radius: number };
  locationPreferences?: string[];
  explanation: string;
}> {
  const response = await apiRequest("POST", "/api/ai/process-location", { query });
  return await response.json();
}