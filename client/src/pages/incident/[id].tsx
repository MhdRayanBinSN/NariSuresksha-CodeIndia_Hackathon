import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Phone, MapPin, Share2, Check } from 'lucide-react';
import { Layout } from '../../components/Layout';
import { MapComponent } from '../../components/MapComponent';
import { useAuth } from '../../hooks/useAuth';
import { useFirebaseMessaging } from '../../hooks/useFirebaseMessaging';
import { useI18n } from '../../lib/i18n';
import { useToast } from '../../hooks/use-toast';
import { subscribeToIncident, subscribeToTrip, updateDoc, doc, db } from '../../lib/firebase';

interface IncidentPageProps {
  params: { id: string };
}

export default function IncidentPage({ params }: IncidentPageProps) {
  const [incident, setIncident] = useState<any>(null);
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();
  const { getWhatsAppFallbackUrl } = useFirebaseMessaging();
  const { t } = useI18n();
  const { toast } = useToast();

  useEffect(() => {
    if (!params.id) return;

    const unsubscribe = subscribeToIncident(params.id, (incidentData) => {
      setIncident(incidentData);
      
      // Subscribe to related trip
      if (incidentData?.tripId) {
        const tripUnsubscribe = subscribeToTrip(incidentData.tripId, setTrip);
        return () => tripUnsubscribe();
      }
    });

    return unsubscribe;
  }, [params.id]);

  const handleCallVictim = () => {
    if (trip?.ownerPhone) {
      window.location.href = `tel:${trip.ownerPhone}`;
    } else {
      toast({
        title: t('errors.phone_not_available'),
        variant: 'destructive',
      });
    }
  };

  const handleOpenMaps = () => {
    if (incident) {
      const url = `https://maps.google.com/?q=${incident.lat},${incident.lng}`;
      window.open(url, '_blank');
    }
  };

  const handleShareLocation = async () => {
    const url = `${window.location.origin}/incident/${incident.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('incident.emergency_alert'),
          text: t('incident.share_text'),
          url,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(url);
        toast({
          title: t('common.copied_to_clipboard'),
        });
      } catch (error) {
        toast({
          title: t('errors.share_failed'),
          variant: 'destructive',
        });
      }
    }
  };

  const handleWhatsAppFallback = () => {
    const url = getWhatsAppFallbackUrl(incident.id);
    window.open(url, '_blank');
  };

  const handleResolveIncident = async () => {
    if (!incident || !user || incident.ownerUid !== user.uid) return;
    
    setLoading(true);
    try {
      await updateDoc(doc(db, 'incidents', incident.id), {
        status: 'resolved',
      });
      
      toast({
        title: t('incident.resolved'),
        description: t('incident.resolved_desc'),
      });
    } catch (error) {
      toast({
        title: t('errors.resolve_failed'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!incident) {
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

  const isOwner = user && incident.ownerUid === user.uid;
  const lastUpdate = trip?.lastUpdateAt ? 
    new Date(trip.lastUpdateAt.seconds * 1000) : 
    new Date(incident.createdAt.seconds * 1000);

  return (
    <Layout showBottomNav={false}>
      {/* Emergency Header */}
      <div className="bg-destructive text-destructive-foreground p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-1">{t('incident.emergency_alert')}</h2>
          <p className="text-destructive-foreground/80">
            {isOwner ? t('incident.your_emergency') : t('incident.someone_needs_help')}
          </p>
        </div>
      </div>

      {/* Live Location Map */}
      <MapComponent 
        position={trip?.lastLat && trip?.lastLng ? {
          lat: trip.lastLat,
          lng: trip.lastLng,
        } : undefined}
        markers={[{
          id: 'incident',
          lat: incident.lat,
          lng: incident.lng,
          type: 'incident',
          popup: t('incident.incident_location'),
        }]}
        className="h-64"
      />

      {/* Emergency Actions */}
      <div className="p-6 space-y-4">
        {!isOwner && (
          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={handleCallVictim}
              className="bg-green-500 hover:bg-green-600 text-white"
              data-testid="button-call-victim"
            >
              <Phone className="w-4 h-4 mr-2" />
              {t('incident.call_victim')}
            </Button>
            
            <Button 
              onClick={handleOpenMaps}
              className="bg-blue-500 hover:bg-blue-600 text-white"
              data-testid="button-open-maps"
            >
              <MapPin className="w-4 h-4 mr-2" />
              {t('incident.open_maps')}
            </Button>
          </div>
        )}

        <Button 
          onClick={handleShareLocation}
          variant="outline"
          className="w-full"
          data-testid="button-share-location"
        >
          <Share2 className="w-4 h-4 mr-2" />
          {t('incident.share_location')}
        </Button>

        {/* WhatsApp Fallback */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-4 h-4 bg-green-600 rounded"></div>
              <span className="text-sm font-medium text-green-800">
                {t('incident.whatsapp_backup')}
              </span>
            </div>
            <p className="text-xs text-green-700 mb-2">
              {t('incident.whatsapp_desc')}
            </p>
            <Button 
              onClick={handleWhatsAppFallback}
              size="sm"
              className="bg-green-500 hover:bg-green-600 text-white"
              data-testid="button-whatsapp-alert"
            >
              {t('incident.send_whatsapp')}
            </Button>
          </CardContent>
        </Card>

        {/* Incident Details */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium text-gray-900 mb-3">
              {t('incident.incident_info')}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('incident.triggered')}:</span>
                <span className="font-medium">
                  {new Date(incident.createdAt.seconds * 1000).toLocaleTimeString()}
                </span>
              </div>
              {trip && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('trip.started')}:</span>
                    <span className="font-medium">
                      {new Date(trip.startedAt.seconds * 1000).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('trip.expected_arrival')}:</span>
                    <span className="font-medium text-red-600">
                      {new Date(trip.startedAt.seconds * 1000 + trip.etaMinutes * 60000).toLocaleTimeString()} 
                      ({t('trip.overdue')})
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">{t('incident.location_accuracy')}:</span>
                <span className="font-medium text-green-600">
                  {t('incident.high_accuracy')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('incident.last_update')}:</span>
                <span className="font-medium">
                  {lastUpdate.toLocaleTimeString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('incident.status')}:</span>
                <span className={`font-medium ${
                  incident.status === 'resolved' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {t(`incident.status_${incident.status}`)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resolution (Victim only) */}
        {isOwner && incident.status !== 'resolved' && (
          <Button 
            onClick={handleResolveIncident}
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 text-white"
            data-testid="button-resolve-incident"
          >
            <Check className="w-4 h-4 mr-2" />
            {loading ? t('common.resolving') : t('incident.mark_resolved')}
          </Button>
        )}
      </div>
    </Layout>
  );
}
