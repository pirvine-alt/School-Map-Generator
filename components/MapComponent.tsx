import React, { useRef, useEffect, useState } from 'react';
import { School, SchoolStatus } from '../types';
import { MAP_CENTER, MAP_ZOOM, MARKER_ICONS } from '../constants';

interface MapComponentProps {
  schools: School[];
  selectedSchool: School | null;
  onSchoolSelect: (school: School) => void;
}

const MapLegend: React.FC = () => (
  <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200 z-10">
    <h3 className="text-lg font-semibold mb-2 text-gray-800">Legend</h3>
    <ul className="space-y-2">
      <li className="flex items-center">
        <img src={MARKER_ICONS[SchoolStatus.Defined]} alt="Defined" className="w-5 h-5 mr-2" />
        <span className="text-gray-700">Defined</span>
      </li>
      <li className="flex items-center">
        <img src={MARKER_ICONS[SchoolStatus.Pending]} alt="Pending" className="w-5 h-5 mr-2" />
        <span className="text-gray-700">Pending</span>
      </li>
      <li className="flex items-center">
        <img src={MARKER_ICONS[SchoolStatus.NoService]} alt="No Service" className="w-5 h-5 mr-2" />
        <span className="text-gray-700">No Service</span>
      </li>
    </ul>
  </div>
);

export const MapComponent: React.FC<MapComponentProps> = ({ schools, selectedSchool, onSchoolSelect }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any | null>(null);
  // Use a Map to store markers with school ID as key for easy lookup
  const markersRef = useRef<Map<string, any>>(new Map());
  // Ref for the info window to ensure there's only one instance
  const infoWindowRef = useRef<any | null>(null);


  useEffect(() => {
    if (mapRef.current && !map) {
      const google = (window as any).google;
      const newMap = new google.maps.Map(mapRef.current, {
        center: MAP_CENTER,
        zoom: MAP_ZOOM,
        mapTypeControl: false,
        streetViewControl: false,
        // Feature: Add explicit zoom controls for better usability
        zoomControl: true,
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_TOP,
        },
        styles: [
            {
                "featureType": "poi.business",
                "stylers": [{ "visibility": "off" }]
            },
            {
                "featureType": "poi.park",
                "elementType": "labels.text",
                "stylers": [{ "visibility": "off" }]
            }
        ]
      });
      setMap(newMap);
      // Create a single InfoWindow instance to be reused
      infoWindowRef.current = new google.maps.InfoWindow();
    }
  }, [map]);

  useEffect(() => {
    if (map && schools.length > 0) {
      // Clear existing markers from the map and the ref
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current.clear();

      const infoWindow = infoWindowRef.current;
      const google = (window as any).google;

      schools.forEach(school => {
        const marker = new google.maps.Marker({
          position: { lat: school.latitude, lng: school.longitude },
          map: map,
          title: school.name,
          icon: {
            url: MARKER_ICONS[school.status],
          },
          animation: google.maps.Animation.DROP,
        });

        const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${school.latitude},${school.longitude}`;

        const contentString = `
            <div class="p-2 font-sans" style="min-width: 280px; max-width: 320px;">
              <h1 class="text-md font-bold text-gray-800">${school.name}</h1>
              <p class="text-sm text-gray-500">${school.administrativeDesignation} | District: ${school.district}</p>
              <hr class="my-2">
              <p class="text-gray-600">${school.address}</p>
              <p class="text-sm mt-2">Status: <span class="font-semibold">${school.status}</span></p>
              <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" class="inline-block mt-3 px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Get Directions
              </a>
            </div>
          `;
        
        // Show info window on hover. It will stay open, allowing users to click inside it.
        marker.addListener('mouseover', () => {
          infoWindow.setContent(contentString);
          infoWindow.open(map, marker);
        });

        // The click listener handles selection for zoom and also ensures the window is open.
        marker.addListener('click', () => {
            onSchoolSelect(school);
            infoWindow.setContent(contentString);
            infoWindow.open(map, marker);
        });

        // Store the marker in the Map using school.id as the key
        markersRef.current.set(school.id, marker);
      });
    }
  }, [map, schools, onSchoolSelect]);
  
  // Effect to handle panning and zooming to a selected school
  useEffect(() => {
    if (map && selectedSchool) {
      const marker = markersRef.current.get(selectedSchool.id);
      if (marker) {
        map.panTo({ lat: selectedSchool.latitude, lng: selectedSchool.longitude });
        map.setZoom(15);
        // Trigger a click on the marker to open its info window persistently
        (window as any).google.maps.event.trigger(marker, 'click');
      }
    }
  }, [map, selectedSchool]);


  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      <MapLegend />
    </div>
  );
};