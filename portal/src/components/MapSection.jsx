// Import additional required components
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Map, Navigation, LocateFixed, Maximize, Route, Layers } from "lucide-react";
import mapboxgl from 'mapbox-gl';
import MapboxDirections from '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions';
import '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// MapBox section in the component
export const MapSection = ({ jamPost }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const directionsControl = useRef(null);
  const [showDirections, setShowDirections] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapStyle, setMapStyle] = useState('satellite');

  // Map style options
  const mapStyles = {
    streets: 'mapbox://styles/mapbox/streets-v11',
    satellite: 'mapbox://styles/mapbox/satellite-v9',
    satelliteStreets: 'mapbox://styles/mapbox/satellite-streets-v11',
    outdoors: 'mapbox://styles/mapbox/outdoors-v11',
    light: 'mapbox://styles/mapbox/light-v10',
    dark: 'mapbox://styles/mapbox/dark-v10'
  };

  // Function to handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (mapContainer.current.requestFullscreen) {
        mapContainer.current.requestFullscreen();
      } else if (mapContainer.current.webkitRequestFullscreen) {
        mapContainer.current.webkitRequestFullscreen();
      } else if (mapContainer.current.msRequestFullscreen) {
        mapContainer.current.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Function to change map style
  const changeMapStyle = (style) => {
    if (map.current) {
      map.current.setStyle(mapStyles[style]);
      setMapStyle(style);
    }
  };

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (document.fullscreenElement === null) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Initialize map when emergency data is loaded
  useEffect(() => {
    if (jamPost && jamPost.latitude && jamPost.longitude) {
      // Initialize map only once
      if (!map.current) {
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: mapStyles[mapStyle], // Set initial style to satellite
          center: [jamPost.longitude, jamPost.latitude],
          zoom: 16 // Slightly closer zoom for satellite view
        });

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        
        // Add geolocate control
        const geolocateControl = new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true,
          showUserHeading: true
        });
        map.current.addControl(geolocateControl, 'top-right');
        
        // Add scale control
        map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

        // Add marker with custom popup
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.style.backgroundImage = 'url(https://img.icons8.com/color/48/000000/marker--v1.png)';
        el.style.width = '48px';
        el.style.height = '48px';
        el.style.backgroundSize = '100%';
        
        marker.current = new mapboxgl.Marker()
        .setLngLat([jamPost.longitude, jamPost.latitude])
          .addTo(map.current);
          
       
          
        // new mapboxgl.Popup({ offset: 25, closeButton: false })
        //   .setLngLat([emergency.lng, emergency.lat])
        //   .setHTML(popupContent)
        //   .addTo(map.current);
          
        // Initialize directions control but don't add it yet
        directionsControl.current = new MapboxDirections({
          accessToken: mapboxgl.accessToken,
          unit: 'metric',
          profile: 'mapbox/driving',
          controls: {
            inputs: true,
            instructions: true
          }
        });
      } else {
        // Update marker position if map already exists
        map.current.setCenter([jamPost.longitude, jamPost.latitude]);
        marker.current.setLngLat([jamPost.longitude, jamPost.latitude]);
      }
    }
  }, [jamPost, mapStyle]);

  // Handle toggling directions
  useEffect(() => {
    if (map.current && directionsControl.current) {
      if (showDirections) {
        map.current.addControl(directionsControl.current, 'top-left');
        // Set the destination to emergency location
        directionsControl.current.setDestination([jamPost.longitude, jamPost.latitude]);
      } else {
        // Try to remove only if it was previously added
        try {
          map.current.removeControl(directionsControl.current);
        } catch (e) {
          // Control might not be added yet
        }
      }
    }
  }, [showDirections, jamPost]);

  if (!jamPost || !jamPost.latitude || !jamPost.longitude) {
    return null;
  }

  // Get display name for current map style
  const getStyleDisplayName = (styleKey) => {
    const styleNames = {
      streets: 'Streets',
      satellite: 'Satellite',
      satelliteStreets: 'Satellite Streets',
      outdoors: 'Outdoors',
      light: 'Light',
      dark: 'Dark'
    };
    return styleNames[styleKey] || styleKey;
  };

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center justify-between mb-2">
        <Label className="flex items-center gap-2">
          <Map className="h-4 w-4" />
          Location Map
        </Label>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Layers className="h-4 w-4 mr-2" />
              {getStyleDisplayName(mapStyle)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {Object.keys(mapStyles).map(style => (
              <DropdownMenuItem 
                key={style}
                onClick={() => changeMapStyle(style)}
                className={mapStyle === style ? "bg-muted" : ""}
              >
                {getStyleDisplayName(style)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="relative">
        <div 
          ref={mapContainer} 
          className="w-full h-[400px] rounded-md border"
          style={{ borderRadius: '0.5rem' }}
        />
        
        <div className="absolute top-2 right-2 flex flex-col gap-2">
          <Button 
            variant="secondary" 
            size="icon"
            className="bg-white text-gray-800 shadow-md hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            <Maximize className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="absolute bottom-2 right-2 flex gap-2">
          <Button 
            variant="secondary" 
            size="sm"
            className="bg-white text-gray-800 shadow-md hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            onClick={() => map.current.flyTo({ center: [jamPost.longitude, jamPost.latitude], zoom: 16 })}
          >
            <LocateFixed className="h-4 w-4 mr-1" />
            Center
          </Button>
          
          <Button 
            variant={showDirections ? "default" : "secondary"}
            size="sm"
            className={!showDirections ? "bg-white text-gray-800 shadow-md hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700" : ""}
            onClick={() => setShowDirections(!showDirections)}
          >
            <Route className="h-4 w-4 mr-1" />
            {showDirections ? "Hide Directions" : "Get Directions"}
          </Button>
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground flex items-center gap-2">
        <Navigation className="h-3 w-3" />
        Use the map controls to zoom, pan, and get directions to the emergency location.
      </div>
    </div>
  );
};

// Usage:
// Replace the map section in your EmergencyDetailsPage with:
// {emergency.lat && emergency.lng && <MapSection emergency={emergency} />}