import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Route, TriangleAlert, Users, MapPin, Settings } from 'lucide-react';
import { Layout } from '../components/Layout';
import { BottomNav } from '../components/BottomNav';
import { useAuth } from '../hooks/useAuth';
import { useDemo } from '../contexts/DemoContext';
import { useI18n } from '../lib/i18n';
import { useToast } from '../hooks/use-toast';
import { createTrip } from '../lib/firebase';

export default function Home() {
  const [, setLocation] = useLocation();
  const [startTripOpen, setStartTripOpen] = useState(false);
  const [etaMinutes, setEtaMinutes] = useState<number>(30);
  const [highContrast, setHighContrast] = useState(false);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();
  const { demoMode, getDemoETA } = useDemo();
  const { t } = useI18n();
  const { toast } = useToast();

  const handleStartTrip = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const tripId = await createTrip({
        ownerUid: user.uid,
        etaMinutes,
        active: true,
      });
      
      toast({
        title: t('trip.started'),
        description: t('trip.started_desc'),
      });
      
      setStartTripOpen(false);
      setLocation(`/trip/${tripId}`);
    } catch (error) {
      toast({
        title: t('errors.trip_start_failed'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const etaOptions = getDemoETA();

  return (
    <Layout>
      <div className="p-6 space-y-6 pb-20">
        {/* Quick Status */}
        <Card className="bg-safety-50 border-safety-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-safety-700">
                {t('status.safe')}
              </span>
            </div>
            <p className="text-xs text-safety-600 mt-1">
              {t('status.last_active', { time: '2 minutes ago' })}
            </p>
          </CardContent>
        </Card>

        {/* Main Actions */}
        <div className="space-y-4">
          <Dialog open={startTripOpen} onOpenChange={setStartTripOpen}>
            <DialogTrigger asChild>
              <Button 
                className="w-full bg-primary text-primary-foreground p-4 rounded-xl flex items-center space-x-3 hover:bg-primary/90 transition-colors shadow-lg"
                size="lg"
                data-testid="button-start-trip"
              >
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Route className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-lg">{t('trip.start_trip')}</h3>
                  <p className="text-primary-foreground/80 text-sm">
                    {t('trip.start_trip_desc')}
                  </p>
                </div>
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="dialog-start-trip">
              <DialogHeader>
                <DialogTitle>{t('trip.start_trip')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">{t('trip.eta_minutes')}</label>
                  <Select value={etaMinutes.toString()} onValueChange={(value) => setEtaMinutes(Number(value))}>
                    <SelectTrigger className="mt-2" data-testid="select-eta">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {etaOptions.map((eta) => (
                        <SelectItem key={eta} value={eta.toString()}>
                          {eta < 1 ? `${eta * 60} ${t('common.seconds')}` : `${eta} ${t('common.minutes')}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleStartTrip}
                  disabled={loading}
                  className="w-full"
                  data-testid="button-confirm-start-trip"
                >
                  {loading ? t('common.starting') : t('trip.start_trip')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button 
            className="w-full bg-warning text-warning-foreground p-4 rounded-xl flex items-center space-x-3 hover:bg-warning/90 transition-colors shadow-lg"
            size="lg"
            onClick={() => setLocation('/reports?action=create')}
            data-testid="button-report-unsafe"
          >
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <TriangleAlert className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-lg">{t('reports.report_unsafe')}</h3>
              <p className="text-warning-foreground/80 text-sm">
                {t('reports.report_unsafe_desc')}
              </p>
            </div>
          </Button>
        </div>

        {/* Secondary Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button 
            variant="outline"
            className="p-4 h-auto"
            onClick={() => setLocation('/guardians')}
            data-testid="button-guardians"
          >
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm font-medium">{t('nav.guardians')}</span>
            </div>
          </Button>

          <Button 
            variant="outline"
            className="p-4 h-auto"
            onClick={() => setLocation('/reports')}
            data-testid="button-view-reports"
          >
            <div className="text-center">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <MapPin className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-sm font-medium">{t('reports.view_reports')}</span>
            </div>
          </Button>
        </div>

        {/* Settings */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              {t('settings.quick_settings')}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{t('settings.high_contrast')}</span>
                <Switch 
                  checked={highContrast}
                  onCheckedChange={setHighContrast}
                  data-testid="switch-high-contrast"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{t('settings.sound_alerts')}</span>
                <Switch 
                  checked={soundAlerts}
                  onCheckedChange={setSoundAlerts}
                  data-testid="switch-sound-alerts"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </Layout>
  );
}
