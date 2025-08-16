import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Shield, Loader2 } from 'lucide-react';
import { setupRecaptcha, sendPhoneOTP, verifyOTP } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';
import { useI18n } from '../lib/i18n';
import { Layout } from '../components/Layout';

export default function Login() {
  const [, setLocation] = useLocation();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp' | 'profile'>('phone');
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('commuter');
  const [demoMode, setDemoMode] = useState(false);
  
  const { user, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();

  useEffect(() => {
    if (user?.profile) {
      setLocation('/');
    }
  }, [user, setLocation]);

  const handleSendOTP = async () => {
    if (!phone.trim()) {
      toast({
        title: t('errors.phone_required'),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      if (demoMode) {
        // Demo mode - skip Firebase phone auth
        setConfirmationResult({ verificationId: 'demo-verification-id' });
        setStep('otp');
        toast({
          title: 'Demo Mode Active',
          description: 'Use OTP: 123456 to continue',
        });
      } else {
        const recaptchaVerifier = setupRecaptcha('recaptcha-container');
        const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
        const result = await sendPhoneOTP(formattedPhone, recaptchaVerifier);
        setConfirmationResult(result);
        setStep('otp');
        toast({
          title: t('auth.otp_sent'),
          description: t('auth.otp_sent_desc'),
        });
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      if (error.code === 'auth/billing-not-enabled' || error.code === 'auth/configuration-not-found') {
        toast({
          title: 'Phone Auth Not Available',
          description: 'Enable Demo Mode to continue without phone verification',
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('errors.otp_send_failed'),
          description: error.message,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: t('errors.otp_invalid'),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      if (demoMode) {
        // Demo mode - check for demo OTP
        if (otp === '123456') {
          setStep('profile');
          toast({
            title: 'Demo Login Successful',
            description: 'You can now complete your profile',
          });
        } else {
          throw new Error('Demo OTP should be 123456');
        }
      } else {
        await verifyOTP(confirmationResult.verificationId, otp);
        setStep('profile');
        toast({
          title: t('auth.phone_verified'),
        });
      }
    } catch (error: any) {
      toast({
        title: t('errors.otp_verify_failed'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async () => {
    if (!name.trim()) {
      toast({
        title: t('errors.name_required'),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      if (demoMode) {
        // Demo mode - create a local demo user session
        const demoUser = {
          uid: 'demo-user-' + Date.now(),
          name: name.trim(),
          phone: phone.startsWith('+91') ? phone : `+91${phone}`,
          role,
          lang: 'en',
          guardians: [],
          pushTokens: [],
          isDemo: true,
        };
        localStorage.setItem('demo-user', JSON.stringify(demoUser));
        toast({
          title: 'Demo Profile Created',
          description: 'Welcome to NariSuraksha demo!',
        });
        window.location.reload(); // Refresh to load demo user
      } else {
        await updateUserProfile({
          name: name.trim(),
          phone: phone.startsWith('+91') ? phone : `+91${phone}`,
          role,
          lang: 'en',
          guardians: [],
          pushTokens: [],
        });
        toast({
          title: t('auth.profile_created'),
        });
        setLocation('/');
      }
    } catch (error: any) {
      toast({
        title: t('errors.profile_creation_failed'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout showBottomNav={false}>
      <div className="p-6 space-y-6">
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t('auth.welcome')}
          </h2>
          <p className="text-muted-foreground">
            {t('auth.welcome_desc')}
          </p>
        </div>

        {step === 'phone' && (
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="bg-orange-50 border border-orange-200 rounded-md p-3 mb-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="demo-mode"
                    checked={demoMode}
                    onChange={(e) => setDemoMode(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="demo-mode" className="text-sm font-medium text-orange-800">
                    Demo Mode (Skip Phone Authentication)
                  </Label>
                </div>
                <p className="text-xs text-orange-700 mt-1">
                  Firebase requires billing for phone auth. Enable demo mode to test the app.
                </p>
              </div>

              <div>
                <Label htmlFor="phone">{t('auth.phone_number')}</Label>
                <div className="relative mt-2">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                    <span className="text-muted-foreground text-sm">+91</span>
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder={demoMode ? "9999999999 (any number for demo)" : t('auth.phone_placeholder')}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-12"
                    data-testid="input-phone"
                  />
                </div>
              </div>

              <Button 
                onClick={handleSendOTP} 
                disabled={loading}
                className="w-full"
                data-testid="button-send-otp"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {demoMode ? 'Continue with Demo' : t('auth.send_otp')}
              </Button>
              
              {!demoMode && <div id="recaptcha-container"></div>}
            </CardContent>
          </Card>
        )}

        {step === 'otp' && (
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div>
                <Label>{t('auth.enter_otp')}</Label>
                <div className="flex justify-center mt-2">
                  <InputOTP 
                    maxLength={6} 
                    value={otp} 
                    onChange={setOtp}
                    data-testid="input-otp"
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
              
              <Button 
                onClick={handleVerifyOTP} 
                disabled={loading}
                className="w-full"
                data-testid="button-verify-otp"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t('auth.verify_continue')}
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={() => setStep('phone')}
                className="w-full"
                data-testid="button-back-to-phone"
              >
                {t('auth.resend_otp')}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'profile' && (
          <Card>
            <CardHeader>
              <CardTitle>{t('auth.complete_profile')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">{t('auth.full_name')}</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder={t('auth.name_placeholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2"
                  data-testid="input-name"
                />
              </div>

              <div>
                <Label htmlFor="role">{t('auth.role')}</Label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full mt-2 px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-ring"
                  data-testid="select-role"
                >
                  <option value="commuter">{t('roles.commuter')}</option>
                  <option value="guardian">{t('roles.guardian')}</option>
                  <option value="both">{t('roles.both')}</option>
                </select>
              </div>

              <Button 
                onClick={handleCompleteProfile} 
                disabled={loading}
                className="w-full"
                data-testid="button-complete-profile"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t('auth.complete_registration')}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
