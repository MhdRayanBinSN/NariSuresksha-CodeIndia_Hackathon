import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, Download, User, Shield } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { useAuth } from '../hooks/useAuth';
import { useDemo } from '../contexts/DemoContext';
import { Switch } from '@/components/ui/switch';

interface LayoutProps {
  children: ReactNode;
  showBottomNav?: boolean;
}

export const Layout = ({ children, showBottomNav = true }: LayoutProps) => {
  const { language, toggleLanguage, t } = useI18n();
  const { user } = useAuth();
  const { demoMode, toggleDemoMode } = useDemo();

  const handleInstallPWA = () => {
    // This will be handled by the beforeinstallprompt event
    window.dispatchEvent(new Event('install-pwa'));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-semibold text-gray-900">{t('app.name')}</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Language Toggle */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={toggleLanguage}
              className="flex items-center space-x-1"
              data-testid="button-language-toggle"
            >
              <span>{language.toUpperCase()}</span>
              <ChevronDown className="w-3 h-3" />
            </Button>
            
            {/* Install PWA */}
            <Button 
              size="sm"
              onClick={handleInstallPWA}
              className="flex items-center space-x-1"
              data-testid="button-install-pwa"
            >
              <Download className="w-3 h-3" />
              <span className="hidden sm:inline">{t('common.install')}</span>
            </Button>
            
            {/* Profile Menu */}
            <Button 
              variant="outline" 
              size="sm"
              className="w-8 h-8 p-0 rounded-full"
              data-testid="button-profile-menu"
            >
              <User className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Demo Mode Toggle */}
        {user && (
          <div className="max-w-md mx-auto px-4 pb-3">
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-warning-foreground">{t('demo.mode')}</span>
              </div>
              <Switch 
                checked={demoMode}
                onCheckedChange={toggleDemoMode}
                data-testid="switch-demo-mode"
              />
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto min-h-screen bg-white relative">
        {children}
      </main>
    </div>
  );
};
