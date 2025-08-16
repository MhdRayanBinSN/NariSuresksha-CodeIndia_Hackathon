import { Home, Users, MapPin, User } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { useI18n } from '../lib/i18n';

const navItems = [
  { path: '/', icon: Home, labelKey: 'nav.home' },
  { path: '/guardians', icon: Users, labelKey: 'nav.guardians' },
  { path: '/reports', icon: MapPin, labelKey: 'nav.reports' },
  { path: '/profile', icon: User, labelKey: 'nav.profile' },
];

export const BottomNav = () => {
  const [location] = useLocation();
  const { t } = useI18n();

  return (
    <div className="max-w-md mx-auto bg-white border-t border-gray-200 fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={cn(
                "p-3 transition-colors",
                isActive ? "text-primary" : "text-gray-400"
              )}
              data-testid={`nav-${item.labelKey.split('.')[1]}`}
            >
              <Icon className="w-5 h-5" />
              <span className="sr-only">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
