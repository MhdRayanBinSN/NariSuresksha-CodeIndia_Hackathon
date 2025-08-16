import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { List, Circle } from 'lucide-react';
import { useI18n } from '../lib/i18n';

interface LogEntry {
  id: string;
  message: string;
  timestamp: Date;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface DispatcherLogProps {
  tripId?: string;
  incidentId?: string;
}

export const DispatcherLog = ({ tripId, incidentId }: DispatcherLogProps) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const { t } = useI18n();

  const addLogEntry = (message: string, type: LogEntry['type'] = 'info') => {
    const entry: LogEntry = {
      id: Date.now().toString(),
      message,
      timestamp: new Date(),
      type,
    };
    setLogs(prev => [entry, ...prev]);
  };

  useEffect(() => {
    if (tripId) {
      addLogEntry(t('log.trip_started'), 'success');
    }
  }, [tripId, t]);

  useEffect(() => {
    if (incidentId) {
      addLogEntry(t('log.incident_created'), 'warning');
      addLogEntry(t('log.guardians_notified'), 'info');
    }
  }, [incidentId, t]);

  const getStatusColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return 'bg-green-500';
      case 'warning': return 'bg-warning';
      case 'error': return 'bg-destructive';
      default: return 'bg-primary';
    }
  };

  return (
    <Card data-testid="dispatcher-log">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-base">
          <List className="w-4 h-4" />
          <span>{t('log.activity_log')}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm max-h-40 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              {t('log.no_activity')}
            </p>
          ) : (
            logs.map((entry) => (
              <div key={entry.id} className="flex items-start space-x-2">
                <Circle className={cn("w-2 h-2 rounded-full mt-2 flex-shrink-0", getStatusColor(entry.type))} />
                <div className="flex-1">
                  <p className="text-gray-700">{entry.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Hook to provide log functions to parent components
export const useDispatcherLog = () => {
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const entry: LogEntry = {
      id: Date.now().toString(),
      message,
      timestamp: new Date(),
      type,
    };
    setLogEntries(prev => [entry, ...prev]);
  };

  return { logEntries, addLog };
};
