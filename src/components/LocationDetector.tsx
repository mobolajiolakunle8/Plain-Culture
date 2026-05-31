import React, { useState } from "react";
import { useGeolocation } from "../hooks/useGeolocation";
import { 
  MapPin, 
  Loader2, 
  AlertCircle, 
  ChevronDown, 
  X, 
  Navigation,
  RefreshCw,
  Shield
} from "lucide-react";

interface LocationDetectorProps {
  onLocationChange?: (location: { city?: string; region?: string; country?: string } | null) => void;
}

export const LocationDetector: React.FC<LocationDetectorProps> = ({ onLocationChange }) => {
  const {
    loading,
    error,
    locationData,
    permissionStatus,
    requestLocation,
    clearLocation,
    isSupported,
  } = useGeolocation();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

  // Notify parent when location changes
  React.useEffect(() => {
    if (onLocationChange) {
      onLocationChange(locationData ? {
        city: locationData.city,
        region: locationData.region,
        country: locationData.country,
      } : null);
    }
  }, [locationData, onLocationChange]);

  const handleRequestLocation = () => {
    if (permissionStatus === "prompt" || permissionStatus === null) {
      setShowPermissionPrompt(true);
    } else {
      requestLocation();
    }
  };

  const handleConfirmPermission = () => {
    setShowPermissionPrompt(false);
    requestLocation();
  };

  const handleClearLocation = () => {
    clearLocation();
    setIsExpanded(false);
  };

  // Not supported state
  if (!isSupported) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
        <MapPin className="w-3.5 h-3.5" />
        <span>Location unavailable</span>
      </div>
    );
  }

  // Permission prompt modal
  if (showPermissionPrompt) {
    return (
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
          onClick={() => setShowPermissionPrompt(false)}
        />
        
        {/* Permission Dialog */}
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-sm animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            {/* Header */}
            <div className="p-5 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#E8FF6B]/20 flex items-center justify-center">
                  <Navigation className="w-5 h-5 text-[#E8FF6B]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                    Enable Location Access
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Help us serve you better
                  </p>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-5 space-y-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                We&apos;d like to detect your location to show you relevant delivery information and nearby pickup points.
              </p>
              
              <div className="flex items-start gap-2 p-3 bg-zinc-50 dark:bg-zinc-950 rounded-md border border-zinc-200 dark:border-zinc-800">
                <Shield className="w-4 h-4 text-[#E8FF6B] mt-0.5 flex-shrink-0" />
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Your location is only used to enhance your shopping experience and is never stored or shared.
                </p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex gap-3">
              <button
                onClick={() => setShowPermissionPrompt(false)}
                className="flex-1 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
              >
                Not Now
              </button>
              <button
                onClick={handleConfirmPermission}
                className="flex-1 px-4 py-2.5 text-xs font-bold uppercase tracking-wider bg-black dark:bg-white text-white dark:text-black rounded-md hover:opacity-90 transition-opacity cursor-pointer"
              >
                Allow Access
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-400 transition-colors cursor-pointer group"
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Location Error</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
        </button>
        
        {isExpanded && (
          <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 p-4 z-50 animate-fade-in">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-1">
                  {error.code === 1 ? "Permission Denied" : "Location Error"}
                </h4>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  {error.message}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={requestLocation}
                className="flex items-center justify-center gap-1.5 flex-1 px-3 py-2 text-xs font-bold uppercase tracking-wider bg-black dark:bg-white text-white dark:text-black rounded-md hover:opacity-90 transition-opacity cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                Try Again
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E8FF6B]" />
        <span className="hidden sm:inline">Detecting location...</span>
      </div>
    );
  }

  // Location detected state
  if (locationData) {
    const displayLocation = locationData.city 
      ? `${locationData.city}${locationData.region ? `, ${locationData.region}` : ""}`
      : `${locationData.latitude.toFixed(2)}°, ${locationData.longitude.toFixed(2)}°`;

    return (
      <div className="relative">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer group"
        >
          <MapPin className="w-3.5 h-3.5 text-[#E8FF6B]" />
          <span className="max-w-[120px] truncate hidden sm:inline">{displayLocation}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
        </button>
        
        {isExpanded && (
          <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden z-50 animate-fade-in">
            {/* Header */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#E8FF6B]/20 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-[#E8FF6B]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                      Your Location
                    </h4>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                      Auto-detected
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 text-zinc-400" />
                </button>
              </div>
            </div>
            
            {/* Location Details */}
            <div className="p-4 space-y-3">
              {locationData.city && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider">City</span>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                    {locationData.city}
                  </span>
                </div>
              )}
              {locationData.region && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider">Region</span>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                    {locationData.region}
                  </span>
                </div>
              )}
              {locationData.country && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider">Country</span>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                    {locationData.country}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Coordinates</span>
                <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
                  {locationData.latitude.toFixed(4)}°, {locationData.longitude.toFixed(4)}°
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Accuracy</span>
                <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
                  ±{Math.round(locationData.accuracy)}m
                </span>
              </div>
            </div>
            
            {/* Actions */}
            <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex gap-2">
              <button
                onClick={requestLocation}
                className="flex items-center justify-center gap-1.5 flex-1 px-3 py-2 text-xs font-bold uppercase tracking-wider bg-black dark:bg-white text-white dark:text-black rounded-md hover:opacity-90 transition-opacity cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </button>
              <button
                onClick={handleClearLocation}
                className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default: No location - prompt to detect
  return (
    <button
      onClick={handleRequestLocation}
      className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer group"
    >
      <MapPin className="w-3.5 h-3.5 group-hover:text-[#E8FF6B] transition-colors" />
      <span className="hidden sm:inline">Detect Location</span>
    </button>
  );
};
