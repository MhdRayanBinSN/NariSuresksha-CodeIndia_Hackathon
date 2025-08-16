import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, MapPin, TriangleAlert, Lightbulb, Dog, MoreHorizontal, Filter } from 'lucide-react';
import { Layout } from '../components/Layout';
import { BottomNav } from '../components/BottomNav';
import { MapComponent } from '../components/MapComponent';
import { useGeolocation } from '../hooks/useGeolocation';
import { useAuth } from '../hooks/useAuth';
import { useDemo } from '../contexts/DemoContext';
import { useI18n } from '../lib/i18n';
import { useToast } from '../hooks/use-toast';
import { createReport, getReports } from '../lib/firebase';
import { encode as geohash } from 'ngeohash';

const reportCategories = [
  { value: 'harassment', icon: TriangleAlert, color: 'red' },
  { value: 'poor_lighting', icon: Lightbulb, color: 'orange' },
  { value: 'stray_dogs', icon: Dog, color: 'yellow' },
  { value: 'other', icon: MoreHorizontal, color: 'gray' },
];

export default function Reports() {
  const [location] = useLocation();
  const [reports, setReports] = useState<any[]>([]);
  const [filteredReports, setFilteredReports] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [createReportOpen, setCreateReportOpen] = useState(false);
  const [reportCategory, setReportCategory] = useState<string>('');
  const [reportText, setReportText] = useState('');
  const [anonymous, setAnonymous] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { position, getLocation } = useGeolocation();
  const { user } = useAuth();
  const { demoMode } = useDemo();
  const { t } = useI18n();
  const { toast } = useToast();

  useEffect(() => {
    // Check if we should open create report dialog
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'create') {
      setCreateReportOpen(true);
      getLocation();
    }
  }, [location, getLocation]);

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    filterReports();
  }, [reports, selectedCategory]);

  const loadReports = async () => {
    try {
      const reportData = await getReports();
      setReports(reportData);
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  };

  const filterReports = () => {
    if (selectedCategory === 'all') {
      setFilteredReports(reports);
    } else {
      setFilteredReports(reports.filter(report => report.category === selectedCategory));
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (createReportOpen) {
      setSelectedLocation({ lat, lng });
    }
  };

  const handleCreateReport = async () => {
    if (!reportCategory) {
      toast({
        title: t('errors.category_required'),
        variant: 'destructive',
      });
      return;
    }

    const reportLocation = selectedLocation || position;
    if (!reportLocation) {
      toast({
        title: t('errors.location_required'),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const reportData = {
        lat: reportLocation.lat,
        lng: reportLocation.lng,
        category: reportCategory,
        text: reportText.trim() || null,
        anonymous,
        geohash: geohash(reportLocation.lat, reportLocation.lng, 8),
      };

      await createReport(reportData);
      
      toast({
        title: t('reports.report_submitted'),
        description: t('reports.report_submitted_desc'),
      });
      
      // Reset form
      setReportCategory('');
      setReportText('');
      setSelectedLocation(null);
      setCreateReportOpen(false);
      
      // Reload reports
      loadReports();
    } catch (error) {
      toast({
        title: t('errors.report_submission_failed'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const categoryData = reportCategories.find(c => c.value === category);
    const Icon = categoryData?.icon || MoreHorizontal;
    return Icon;
  };

  const getCategoryColor = (category: string) => {
    const categoryData = reportCategories.find(c => c.value === category);
    return categoryData?.color || 'gray';
  };

  const getMarkers = () => {
    // Cluster nearby reports by rounding coordinates
    const clustered = new Map();
    
    filteredReports.forEach(report => {
      const lat = Math.round(report.lat * 1000) / 1000;
      const lng = Math.round(report.lng * 1000) / 1000;
      const key = `${lat},${lng}`;
      
      if (clustered.has(key)) {
        clustered.get(key).count++;
      } else {
        clustered.set(key, {
          id: report.id,
          lat: report.lat,
          lng: report.lng,
          type: 'report',
          count: 1,
          category: report.category,
          popup: `${t(`reports.categories.${report.category}`)} (${1} report${1 > 1 ? 's' : ''})`,
        });
      }
    });
    
    return Array.from(clustered.values());
  };

  const getRiskLevel = (category: string) => {
    const riskLevels = {
      harassment: { level: t('reports.high_risk'), color: 'red' },
      poor_lighting: { level: t('reports.medium_risk'), color: 'orange' },
      stray_dogs: { level: t('reports.low_risk'), color: 'yellow' },
      other: { level: t('reports.low_risk'), color: 'gray' },
    };
    
    return riskLevels[category as keyof typeof riskLevels] || riskLevels.other;
  };

  return (
    <Layout>
      {/* Filter Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">{t('reports.safety_reports')}</h2>
          <Button 
            size="sm"
            onClick={() => {
              setCreateReportOpen(true);
              getLocation();
            }}
            data-testid="button-create-report"
          >
            <Plus className="w-4 h-4 mr-1" />
            {t('reports.report')}
          </Button>
        </div>
        
        {/* Category Filters */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
            data-testid="filter-all"
          >
            {t('reports.all')}
          </Button>
          {reportCategories.map((category) => (
            <Button
              key={category.value}
              variant={selectedCategory === category.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.value)}
              className="whitespace-nowrap"
              data-testid={`filter-${category.value}`}
            >
              {t(`reports.categories.${category.value}`)}
            </Button>
          ))}
        </div>
      </div>

      {/* Map with Reports */}
      <MapComponent 
        position={position}
        markers={getMarkers()}
        className="h-96"
        onClick={handleMapClick}
      />

      {/* Recent Reports List */}
      <div className="p-4 space-y-3 pb-20">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">{t('reports.recent_reports')}</h3>
          <Badge variant="outline">
            {filteredReports.length} {t('reports.reports')}
          </Badge>
        </div>
        
        {filteredReports.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-2">
                {t('reports.no_reports')}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {selectedCategory === 'all' 
                  ? t('reports.no_reports_desc')
                  : t('reports.no_reports_category_desc')
                }
              </p>
              <Button 
                onClick={() => {
                  setCreateReportOpen(true);
                  getLocation();
                }}
                data-testid="button-create-first-report"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('reports.create_first_report')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredReports.slice(0, 10).map((report) => {
            const Icon = getCategoryIcon(report.category);
            const riskLevel = getRiskLevel(report.category);
            
            return (
              <Card key={report.id} data-testid={`report-card-${report.id}`}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 bg-${riskLevel.color}-100 rounded-full flex items-center justify-center mt-1`}>
                        <Icon className={`w-4 h-4 text-${riskLevel.color}-600`} />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {t(`reports.categories.${report.category}`)}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {t('reports.near_location')} {/* Placeholder for location name */}
                        </p>
                        {report.text && (
                          <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                            {report.text}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(report.createdAt.seconds * 1000).toLocaleDateString()} • 
                          {report.anonymous ? t('reports.anonymous') : t('reports.verified')}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-${riskLevel.color}-600 border-${riskLevel.color}-200`}
                    >
                      {riskLevel.level}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Create Report Dialog */}
      <Dialog open={createReportOpen} onOpenChange={setCreateReportOpen}>
        <DialogContent data-testid="dialog-create-report">
          <DialogHeader>
            <DialogTitle>{t('reports.report_unsafe_spot')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('reports.location')}
              </label>
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm text-gray-700">
                  {selectedLocation 
                    ? t('reports.custom_location_selected')
                    : position 
                      ? t('reports.current_location_detected')
                      : t('reports.location_unavailable')
                  }
                </span>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('reports.category')}
              </label>
              <Select value={reportCategory} onValueChange={setReportCategory}>
                <SelectTrigger data-testid="select-report-category">
                  <SelectValue placeholder={t('reports.select_category')} />
                </SelectTrigger>
                <SelectContent>
                  {reportCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {t(`reports.categories.${category.value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('reports.description')} ({t('common.optional')})
              </label>
              <Textarea
                placeholder={t('reports.description_placeholder')}
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                rows={3}
                data-testid="textarea-report-description"
              />
            </div>

            {/* Anonymous Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {t('reports.report_anonymously')}
              </span>
              <Switch 
                checked={anonymous}
                onCheckedChange={setAnonymous}
                data-testid="switch-anonymous"
              />
            </div>

            {/* Submit */}
            <Button 
              onClick={handleCreateReport}
              disabled={loading}
              className="w-full"
              data-testid="button-submit-report"
            >
              {loading ? t('common.submitting') : t('reports.submit_report')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </Layout>
  );
}
