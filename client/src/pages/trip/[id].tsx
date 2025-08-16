import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Check, AlertTriangle } from 'lucide-react';
import { Layout } from '../../components/Layout';
import { MapComponent } from '../../components/MapComponent';
import { DispatcherLog } from '../../components/DispatcherLog';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useAuth } from '../../hooks/useAuth';
import { useDemo } from '../../contexts/DemoContext';
import { useI18n } from '../../lib/i18n';
import { useToast } from '../../hooks/use-toast';
import { subscribeToTrip, updateTripLocation, createIncident, updateDoc, doc, db } from '../../lib/firebase';

interface TripPageProps {
  params: { id: string };
}

export default function TripPage({ params }: TripPageProps) {
  const [, setLocation] = useLocation();
  const [trip, setTrip] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [incidentId, setIncidentId] = useState<string | null>(null);
  
  const { position, startWatching, stopWatching } = useGeolocation();
  const { user } = useAuth();
  const { demoMode } = useDemo();
  const { t } = useI18n();
  const { toast } = useToast();

  useEffect(() => {
    if (!params.id) return;

    const unsubscribe = subscribeToTrip(params.id, (tripData) => {
      setTrip(tripData);
      
      if (tripData && tripData.active) {
        const eta = new Date(tripData.startedAt.seconds * 1000);
        eta.setMinutes(eta.getMinutes() + tripData.etaMinutes);
        const remaining = Math.max(0, eta.getTime() - Date.now());
        setTimeRemaining(remaining);
        
        // Auto-trigger SOS if time expires
        if (remaining <= 0 && !incidentId) {
          handleAutoSOS();
        }
      }
    });

    return unsubscribe;
  }, [params.id]);

  useEffect(() => {
    startWatching();
    return stopWatching;
  }, [startWatching, stopWatching]);

  useEffect(() => {
    // Update trip location when position changes
    if (position && trip && trip.active) {
      updateTripLocation(trip.id, position.lat, position.lng);
    }
  }, [position, trip]);

  useEffect(() => {
    // Countdown timer
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1000;
          if (newTime <= 0 && trip?.active && !incidentId) {
            handleAutoSOS();
          }
          return Math.max(0, newTime);
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [timeRemaining, trip, incidentId]);

  const handleAutoSOS = async () => {
    if (!trip || !user || !position) return;
    
    try {
      const newIncidentId = await createIncident({
        tripId: trip.id,
        ownerUid: user.uid,
        lat: position.lat,
        lng: position.lng,
        status: 'broadcasting',
      });
      
      setIncidentId(newIncidentId);
      
      toast({
        title: t('incident.auto_sos_triggered'),
        description: t('incident.guardians_notified'),
      });
      
      setLocation(`/incident/${newIncidentId}`);
    } catch (error) {
      toast({
        title: t('errors.sos_failed'),
        variant: 'destructive',
      });
    }
  };

  const handleManualSOS = async () => {
    if (!trip || !user || !position) return;
    
    try {
      const newIncidentId = await createIncident({
        tripId: trip.id,
        ownerUid: user.uid,
        lat: position.lat,
        lng: position.lng,
        status: 'broadcasting',
      });
      
      setIncidentId(newIncidentId);
      
      toast({
        title: t('incident.sos_triggered'),
        description: t('incident.guardians_notified'),
      });
      
      setLocation(`/incident/${newIncidentId}`);
    } catch (error) {
      toast({
        title: t('errors.sos_failed'),
        variant: 'destructive',
      });
    }
  };

  const handleEndTrip = async () => {
    if (!trip) return;
    
    try {
      await updateDoc(doc(db, 'trips', trip.id), {
        active: false,
      });
      
      stopWatching();
      
      toast({
        title: t('trip.ended_safely'),
      });
      
      setLocation('/');
    } catch (error) {
      toast({
        title: t('errors.trip_end_failed'),
        variant: 'destructive',
      });
    }
  };

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!trip) {
    return (
      <Layout showBottomNav={false}>
        <div className="p-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">{t('common.loading')}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBottomNav={false}>
      {/* Trip Header */}
      <div className="bg-primary text-primary-foreground p-6">
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation('/')}
            className="text-primary-foreground hover:bg-white/20"
            data-testid="button-back-home"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h2 className="font-semibold">{t('trip.in_progress')}</h2>
          <div className="w-8"></div>
        </div>

        {/* ETA Countdown */}
        <div className="text-center">
          <div className="text-4xl font-bold mb-2" data-testid="text-eta-countdown">
            {formatTime(timeRemaining)}
          </div>
          <p className="text-primary-foreground/80">
            {timeRemaining > 0 ? t('trip.eta_remaining') : t('trip.overdue')}
          </p>
        </div>
      </div>

      {/* Live Map */}
      <MapComponent 
        position={position}
        markers={position ? [{
          id: 'user',
          lat: position.lat,
          lng: position.lng,
          type: 'user',
          popup: t('map.your_location'),
        }] : []}
        className="h-64"
      />

      {/* Trip Controls */}
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Button 
            onClick={handleEndTrip}
            className="bg-green-500 hover:bg-green-600 text-white"
            data-testid="button-end-trip"
          >
            <Check className="w-4 h-4 mr-2" />
            {t('trip.im_safe')}
          </Button>
          
          <Button 
            onClick={handleManualSOS}
            variant="destructive"
            className="animate-pulse"
            data-testid="button-manual-sos"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            {t('trip.sos_now')}
          </Button>
        </div>

        {/* Trip Info */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium text-gray-900 mb-2">{t('trip.details')}</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>{t('trip.started')}:</span>
                <span>{new Date(trip.startedAt.seconds * 1000).toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('trip.expected_arrival')}:</span>
                <span>
                  {new Date(trip.startedAt.seconds * 1000 + trip.etaMinutes * 60000).toLocaleTimeString()}
                  {timeRemaining <= 0 && (
                    <span className="text-red-600 ml-1">({t('trip.overdue')})</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t('trip.guardians_notified')}:</span>
                <span className="text-green-600">
                  {user?.profile?.guardians?.length || 0} {t('common.contacts')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dispatcher Log */}
        <DispatcherLog tripId={trip.id} incidentId={incidentId} />
      </div>
    </Layout>
  );
}
