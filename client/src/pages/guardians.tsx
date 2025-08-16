import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, User, MoreVertical, Bell, BellOff } from 'lucide-react';
import { Layout } from '../components/Layout';
import { BottomNav } from '../components/BottomNav';
import { useAuth } from '../hooks/useAuth';
import { useFirebaseMessaging } from '../hooks/useFirebaseMessaging';
import { useI18n } from '../lib/i18n';
import { useToast } from '../hooks/use-toast';
import { updateUserDocument } from '../lib/firebase';

export default function Guardians() {
  const [guardians, setGuardians] = useState<Array<{ name: string; phone: string }>>([]);
  const [addGuardianOpen, setAddGuardianOpen] = useState(false);
  const [newGuardianName, setNewGuardianName] = useState('');
  const [newGuardianPhone, setNewGuardianPhone] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { user, updateUserProfile } = useAuth();
  const { permission, requestPermission, loading: fcmLoading, token } = useFirebaseMessaging();
  const { t } = useI18n();
  const { toast } = useToast();

  useEffect(() => {
    if (user?.profile?.guardians) {
      setGuardians(user.profile.guardians);
    }
  }, [user]);

  const handleAddGuardian = async () => {
    if (!newGuardianName.trim() || !newGuardianPhone.trim()) {
      toast({
        title: t('errors.guardian_fields_required'),
        variant: 'destructive',
      });
      return;
    }

    const formattedPhone = newGuardianPhone.startsWith('+91') ? 
      newGuardianPhone : `+91${newGuardianPhone}`;

    const newGuardian = {
      name: newGuardianName.trim(),
      phone: formattedPhone,
    };

    setLoading(true);
    try {
      const updatedGuardians = [...guardians, newGuardian];
      await updateUserDocument(user!.uid, {
        guardians: updatedGuardians,
      });
      
      setGuardians(updatedGuardians);
      setNewGuardianName('');
      setNewGuardianPhone('');
      setAddGuardianOpen(false);
      
      toast({
        title: t('guardians.guardian_added'),
        description: t('guardians.guardian_added_desc', { name: newGuardian.name }),
      });
    } catch (error) {
      toast({
        title: t('errors.guardian_add_failed'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveGuardian = async (index: number) => {
    const guardian = guardians[index];
    const updatedGuardians = guardians.filter((_, i) => i !== index);
    
    try {
      await updateUserDocument(user!.uid, {
        guardians: updatedGuardians,
      });
      
      setGuardians(updatedGuardians);
      
      toast({
        title: t('guardians.guardian_removed'),
        description: t('guardians.guardian_removed_desc', { name: guardian.name }),
      });
    } catch (error) {
      toast({
        title: t('errors.guardian_remove_failed'),
        variant: 'destructive',
      });
    }
  };

  const getPermissionStatus = () => {
    switch (permission) {
      case 'granted':
        return { text: t('notifications.enabled'), color: 'bg-green-500' };
      case 'denied':
        return { text: t('notifications.blocked'), color: 'bg-red-500' };
      default:
        return { text: t('notifications.not_requested'), color: 'bg-gray-500' };
    }
  };

  const permissionStatus = getPermissionStatus();

  return (
    <Layout>
      <div className="p-6 space-y-6 pb-20">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{t('nav.guardians')}</h2>
          <Dialog open={addGuardianOpen} onOpenChange={setAddGuardianOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-add-guardian">
                <Plus className="w-4 h-4 mr-1" />
                {t('guardians.add_guardian')}
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="dialog-add-guardian">
              <DialogHeader>
                <DialogTitle>{t('guardians.add_new_guardian')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="guardian-name">{t('guardians.guardian_name')}</Label>
                  <Input
                    id="guardian-name"
                    placeholder={t('guardians.name_placeholder')}
                    value={newGuardianName}
                    onChange={(e) => setNewGuardianName(e.target.value)}
                    className="mt-2"
                    data-testid="input-guardian-name"
                  />
                </div>
                <div>
                  <Label htmlFor="guardian-phone">{t('guardians.phone_number')}</Label>
                  <Input
                    id="guardian-phone"
                    type="tel"
                    placeholder={t('guardians.phone_placeholder')}
                    value={newGuardianPhone}
                    onChange={(e) => setNewGuardianPhone(e.target.value)}
                    className="mt-2"
                    data-testid="input-guardian-phone"
                  />
                </div>
                <Button 
                  onClick={handleAddGuardian}
                  disabled={loading}
                  className="w-full"
                  data-testid="button-confirm-add-guardian"
                >
                  {loading ? t('common.adding') : t('guardians.add_guardian')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Notification Status */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-blue-900 flex items-center">
                  {permission === 'granted' ? (
                    <Bell className="w-4 h-4 mr-2" />
                  ) : (
                    <BellOff className="w-4 h-4 mr-2" />
                  )}
                  {t('notifications.push_notifications')}
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  {permission === 'granted' 
                    ? t('notifications.enabled_desc')
                    : t('notifications.enable_desc')
                  }
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <div className={`w-2 h-2 ${permissionStatus.color} rounded-full`}></div>
                  <span className="text-xs text-blue-600">{permissionStatus.text}</span>
                </div>
              </div>
              {permission !== 'granted' && (
                <Button 
                  onClick={requestPermission}
                  disabled={fcmLoading}
                  size="sm"
                  data-testid="button-enable-notifications"
                >
                  {fcmLoading ? t('common.enabling') : t('notifications.enable')}
                </Button>
              )}
            </div>
            {token && (
              <div className="mt-3 text-xs text-blue-600">
                {t('notifications.last_updated')}: {new Date().toLocaleDateString()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Guardians List */}
        <div className="space-y-3">
          {guardians.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">
                  {t('guardians.no_guardians')}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('guardians.no_guardians_desc')}
                </p>
                <Button 
                  onClick={() => setAddGuardianOpen(true)}
                  data-testid="button-add-first-guardian"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('guardians.add_first_guardian')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            guardians.map((guardian, index) => (
              <Card key={index} data-testid={`guardian-card-${index}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{guardian.name}</h3>
                        <p className="text-sm text-gray-600">{guardian.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        {t('guardians.active')}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRemoveGuardian(index)}
                        data-testid={`button-remove-guardian-${index}`}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('guardians.how_it_works')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• {t('guardians.instruction_1')}</p>
            <p>• {t('guardians.instruction_2')}</p>
            <p>• {t('guardians.instruction_3')}</p>
            <p>• {t('guardians.instruction_4')}</p>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </Layout>
  );
}
