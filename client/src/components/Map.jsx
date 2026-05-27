import { useEffect, useRef } from 'react';
import L from 'leaflet';

function Map({ pickup, destination, driverLocation, onSelectCoords }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const destinationMarkerRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const routeLineRef = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current && mapContainerRef.current) {
      // Create Map centered in Bengaluru, or fallback
      const defaultCenter = [12.9716, 77.5946]; // Bengaluru
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView(defaultCenter, 12);

      // CartoDB Dark Matter tiles (premium dark theme)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
      }).addTo(mapRef.current);

      // Add Zoom Control on top right
      L.control.zoom({ position: 'topright' }).addTo(mapRef.current);
    }

    return () => {
      // Clean up map on unmount
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Handle container resize to invalidate map size and keep alignment correct
  useEffect(() => {
    if (!mapRef.current || !mapContainerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    });

    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Handle map click for selecting coordinates
  useEffect(() => {
    if (!mapRef.current) return;

    const handleMapClick = (e) => {
      if (onSelectCoords) {
        onSelectCoords(e.latlng);
      }
    };

    mapRef.current.on('click', handleMapClick);

    return () => {
      if (mapRef.current) {
        mapRef.current.off('click', handleMapClick);
      }
    };
  }, [onSelectCoords]);

  // Update Markers and Route
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const markersToFit = [];

    // Custom CSS styling for markers (Tailwind compatible classes)
    const pickupIcon = L.divIcon({
      html: `
        <div class="relative w-8 h-8 flex items-center justify-center">
          <div class="absolute w-8 h-8 rounded-full bg-purple-500/30 animate-ping"></div>
          <div class="w-4 h-4 rounded-full bg-purple-500 border-2 border-slate-900 shadow-md"></div>
        </div>
      `,
      className: 'custom-div-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const destinationIcon = L.divIcon({
      html: `
        <div class="relative w-8 h-8 flex items-center justify-center">
          <div class="absolute w-8 h-8 rounded-full bg-fuchsia-500/30 animate-ping"></div>
          <div class="w-4 h-4 rounded-sm bg-fuchsia-500 border-2 border-slate-900 shadow-md transform rotate-45"></div>
        </div>
      `,
      className: 'custom-div-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const driverIcon = L.divIcon({
      html: `
        <div class="relative w-10 h-10 flex items-center justify-center bg-indigo-500 rounded-full border border-slate-900 shadow-lg text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-car"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
        </div>
      `,
      className: 'custom-div-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    // 1. Pickup Marker
    if (pickup && pickup.lat && pickup.lng) {
      const latlng = [pickup.lat, pickup.lng];
      markersToFit.push(latlng);
      if (pickupMarkerRef.current) {
        pickupMarkerRef.current.setLatLng(latlng);
      } else {
        pickupMarkerRef.current = L.marker(latlng, { icon: pickupIcon }).addTo(map);
      }
    } else {
      if (pickupMarkerRef.current) {
        map.removeLayer(pickupMarkerRef.current);
        pickupMarkerRef.current = null;
      }
    }

    // 2. Destination Marker
    if (destination && destination.lat && destination.lng) {
      const latlng = [destination.lat, destination.lng];
      markersToFit.push(latlng);
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.setLatLng(latlng);
      } else {
        destinationMarkerRef.current = L.marker(latlng, { icon: destinationIcon }).addTo(map);
      }
    } else {
      if (destinationMarkerRef.current) {
        map.removeLayer(destinationMarkerRef.current);
        destinationMarkerRef.current = null;
      }
    }

    // 3. Driver Marker
    if (driverLocation && driverLocation.lat && driverLocation.lng) {
      const latlng = [driverLocation.lat, driverLocation.lng];
      markersToFit.push(latlng);
      if (driverMarkerRef.current) {
        driverMarkerRef.current.setLatLng(latlng);
      } else {
        driverMarkerRef.current = L.marker(latlng, { icon: driverIcon }).addTo(map);
      }
    } else {
      if (driverMarkerRef.current) {
        map.removeLayer(driverMarkerRef.current);
        driverMarkerRef.current = null;
      }
    }

    // 4. Route Line (OSRM Real Road Routing)
    if (pickup && pickup.lat && pickup.lng && destination && destination.lat && destination.lng) {
      const fetchRoute = async () => {
        try {
          const res = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
          );
          if (!res.ok) throw new Error('OSRM routing failed');
          
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            const coordinates = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
            
            if (routeLineRef.current) {
              routeLineRef.current.setLatLngs(coordinates);
            } else {
              routeLineRef.current = L.polyline(coordinates, {
                color: '#8b5cf6', // purple-500
                weight: 4,
                opacity: 0.8,
                dashArray: '10, 8'
              }).addTo(map);
            }
          }
        } catch (error) {
          console.warn('Could not draw road route, falling back to straight line:', error);
          const straightCoords = [
            [pickup.lat, pickup.lng],
            [destination.lat, destination.lng]
          ];
          if (routeLineRef.current) {
            routeLineRef.current.setLatLngs(straightCoords);
          } else {
            routeLineRef.current = L.polyline(straightCoords, {
              color: '#8b5cf6',
              weight: 4,
              opacity: 0.8,
              dashArray: '5, 5'
            }).addTo(map);
          }
        }
      };

      fetchRoute();
    } else {
      if (routeLineRef.current) {
        map.removeLayer(routeLineRef.current);
        routeLineRef.current = null;
      }
    }

    // Fit bounds of markers
    if (markersToFit.length > 1) {
      map.fitBounds(L.latLngBounds(markersToFit), { padding: [50, 50] });
    } else if (markersToFit.length === 1) {
      map.setView(markersToFit[0], 14);
    }
  }, [pickup, destination, driverLocation]);

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full bg-slate-900" />
      {/* Map Guidelines overlay */}
      <div className="absolute top-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur border border-slate-800 px-3 py-2 rounded-xl text-xs text-slate-400 pointer-events-none shadow-lg">
        💡 Click on map to select pickup and destination pins.
      </div>
    </div>
  );
}

export default Map;
