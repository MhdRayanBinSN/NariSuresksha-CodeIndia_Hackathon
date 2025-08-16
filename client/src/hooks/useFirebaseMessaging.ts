import { useState, useEffect } from 'react';
import { getFCMToken, onForegroundMessage, updateUserDocument } from '../lib/firebase';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export const useFirebaseMessaging = () => {
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    setPermission(Notification.permission);
  }, []);

  useEffect(() => {
    // Handle foreground messages
    const unsubscribe = onForegroundMessage((payload) => {
      toast({
        title: payload.notification?.title || 'New Message',
        description: payload.notification?.body || 'You have a new notification',
      });

      // If the message contains a link, we could navigate to it
      if (payload.data?.link) {
        // Handle navigation to incident page
        window.open(payload.data.link, '_blank');
      }
    });

    return unsubscribe;
  }, [toast]);

  const requestPermission = async () => {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === 'granted') {
        const fcmToken = await getFCMToken();
        if (fcmToken) {
          setToken(fcmToken);
          
          // Save token to user document
          if (user) {
            const currentTokens = user.profile?.pushTokens || [];
            if (!currentTokens.includes(fcmToken)) {
              await updateUserDocument(user.uid, {
                pushTokens: [...currentTokens, fcmToken],
              });
            }
          }

          toast({
            title: 'Notifications Enabled',
            description: 'You will now receive emergency alerts',
          });
        }
      } else {
        toast({
          title: 'Notifications Blocked',
          description: 'Please enable notifications in browser settings',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        title: 'Error',
        description: 'Failed to enable notifications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getWhatsAppFallbackUrl = (incidentId: string) => {
    const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
    const message = encodeURIComponent(
      `🚨 EMERGENCY ALERT 🚨\n\nSomeone needs immediate assistance. View live location:\n${siteUrl}/incident/${incidentId}`
    );
    return `https://wa.me/?text=${message}`;
  };

  return {
    token,
    permission,
    loading,
    requestPermission,
    getWhatsAppFallbackUrl,
    isSupported: 'Notification' in window && 'serviceWorker' in navigator,
  };
};
