import { useState, useEffect } from "react";
import { Property } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface MapViewProps {
  properties: Property[];
  selectedProperty: Property | null;
  onSelectProperty: (property: Property | null) => void;
}

export default function MapView({ properties, selectedProperty, onSelectProperty }: MapViewProps) {
  // In a real implementation, we would integrate with a mapping library
  // like Google Maps, Mapbox, or Leaflet here
  
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Map Container */}
      <div className="h-[50vh] min-h-[300px] bg-gray-100 rounded-xl shadow-sm mb-6 relative overflow-hidden">
        {/* Placeholder for map */}
        <div className="absolute inset-0 bg-secondary flex items-center justify-center">
          <div className="text-center">
            <span className="material-icons text-5xl text-primary mb-4">map</span>
            <p className="text-text-medium">
              Map would be displayed here, integrated with a mapping API
            </p>
          </div>
        </div>
        
        {/* Map controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          <Button size="icon" variant="secondary" className="rounded-full w-10 h-10">
            <span className="material-icons">add</span>
          </Button>
          <Button size="icon" variant="secondary" className="rounded-full w-10 h-10">
            <span className="material-icons">remove</span>
          </Button>
          <Button size="icon" variant="secondary" className="rounded-full w-10 h-10">
            <span className="material-icons">my_location</span>
          </Button>
        </div>
      </div>
      
      {/* Selected Property Preview */}
      {selectedProperty ? (
        <Card className="bg-white rounded-xl shadow-sm p-4">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-1/3">
                <img 
                  src={selectedProperty.images?.[0] || "https://via.placeholder.com/500x300?text=No+Image"}
                  alt={selectedProperty.title} 
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
              <div className="w-full md:w-2/3">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-heading font-medium text-xl text-text-dark">
                    {selectedProperty.title}
                  </h3>
                  <span className="text-primary font-medium">
                    ${selectedProperty.rent.toLocaleString()}/mo
                  </span>
                </div>
                <p className="text-text-medium text-sm mb-3">
                  {selectedProperty.address}, {selectedProperty.neighborhood}, {selectedProperty.city}
                </p>
                <div className="flex gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    <span className="material-icons text-text-medium text-sm">king_bed</span>
                    <span>{selectedProperty.bedrooms === 0 ? 'Studio' : `${selectedProperty.bedrooms} bed${selectedProperty.bedrooms > 1 ? 's' : ''}`}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-icons text-text-medium text-sm">bathtub</span>
                    <span>{selectedProperty.bathrooms} bath{selectedProperty.bathrooms !== 1 ? 's' : ''}</span>
                  </div>
                  {selectedProperty.squareFeet && (
                    <div className="flex items-center gap-1">
                      <span className="material-icons text-text-medium text-sm">straighten</span>
                      <span>{selectedProperty.squareFeet.toLocaleString()} sqft</span>
                    </div>
                  )}
                </div>
                <p className="text-text-medium mb-4">{selectedProperty.description}</p>
                <div className="flex gap-2">
                  <Button>
                    Contact Agent
                  </Button>
                  <Button variant="secondary">
                    Schedule Tour
                  </Button>
                  <Link href={`/properties/${selectedProperty.id}`} className="ml-auto">
                    <Button variant="outline">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white rounded-xl shadow-sm p-6 text-center">
          <p className="text-text-medium">Select a property on the map to view details</p>
        </Card>
      )}
    </div>
  );
}
