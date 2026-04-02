import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { sosAPI, locationAPI } from '../services/api';
import { getSocket, watchSOS, sendLocation } from '../services/socket';
import { useAuth } from './AuthContext';

const SOSContext = createContext(null);

export const SOSProvider = ({ children }) => {
  const { user }         = useAuth();
  const [activeSOS, setActiveSOS]   = useState(null);
  const [loading,   setLoading]     = useState(false);
  const [error,     setError]       = useState(null);
  const locationWatchRef = useRef(null);

  // Check for existing active SOS on mount
  useEffect(() => {
    if (!user) return;
    sosAPI.getActive().then(({ data }) => {
      if (data.sos) {
        setActiveSOS(data.sos);
        startLocationTracking(data.sos._id);
        watchSOS(data.sos._id);
      }
    }).catch(() => {});
  }, [user]);

  // Listen for real-time socket events
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('sos:resolved', ({ sosId }) => {
      if (activeSOS?._id === sosId) setActiveSOS(null);
    });

    return () => { socket.off('sos:resolved'); };
  }, [activeSOS]);

  // GPS tracking during active SOS
  const startLocationTracking = useCallback((sosId) => {
    if (!navigator.geolocation) return;
    if (locationWatchRef.current) navigator.geolocation.clearWatch(locationWatchRef.current);

    locationWatchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = [pos.coords.longitude, pos.coords.latitude];
        sendLocation(sosId, coords);
        locationAPI.update(coords).catch(() => {});
      },
      (err) => console.warn('GPS error:', err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
  }, []);

  const stopLocationTracking = useCallback(() => {
    if (locationWatchRef.current) {
      navigator.geolocation.clearWatch(locationWatchRef.current);
      locationWatchRef.current = null;
    }
  }, []);

  // Trigger SOS
  const triggerSOS = useCallback(async (method = 'button') => {
    setLoading(true);
    setError(null);
    try {
      const coords = await getCurrentPosition();
      const { data } = await sosAPI.trigger({
        coordinates:   coords,
        triggerMethod: method,
      });
      const { data: sosData } = await sosAPI.getActive();
      setActiveSOS(sosData.sos);
      if (sosData.sos) {
        startLocationTracking(sosData.sos._id);
        watchSOS(sosData.sos._id);
      }
      return data;
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to trigger SOS';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [startLocationTracking]);

  // Resolve SOS
  const resolveSOS = useCallback(async (note) => {
    if (!activeSOS) return;
    setLoading(true);
    try {
      await sosAPI.resolve(activeSOS._id, note);
      stopLocationTracking();
      setActiveSOS(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resolve SOS');
    } finally {
      setLoading(false);
    }
  }, [activeSOS, stopLocationTracking]);

  return (
    <SOSContext.Provider value={{ activeSOS, loading, error, triggerSOS, resolveSOS, setError }}>
      {children}
    </SOSContext.Provider>
  );
};

export const useSOS = () => {
  const ctx = useContext(SOSContext);
  if (!ctx) throw new Error('useSOS must be used within SOSProvider');
  return ctx;
};

// Helper: get current GPS position as a promise
const getCurrentPosition = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve([pos.coords.longitude, pos.coords.latitude]),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
