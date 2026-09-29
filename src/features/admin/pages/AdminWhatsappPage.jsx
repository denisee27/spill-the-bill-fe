import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { MessageCircle } from 'lucide-react';
import api from '../../../shared/services/api';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';

async function getWhatsappSettings() {
  const res = await api.get('/whatsapp/settings');
  return res.data;
}

async function saveWhatsappSettings(data) {
  const res = await api.patch('/whatsapp/settings', data);
  return res.data;
}

export function AdminWhatsappPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'whatsapp'],
    queryFn: getWhatsappSettings,
  });

  const settings = data?.data || data?.settings || data || {};

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const phone = watch('phoneNumber', '');
  const message = watch('defaultMessage', '');

  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      reset({
        phoneNumber: settings.phoneNumber || '',
        defaultMessage: settings.defaultMessage || '',
      });
    }
  }, [settings, reset]);

  const saveMutation = useMutation({
    mutationFn: saveWhatsappSettings,
    onSuccess: () => {
      toast.success('WhatsApp settings saved!');
      queryClient.invalidateQueries({ queryKey: ['admin', 'whatsapp'] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to save'),
  });

  const previewUrl =
    phone
      ? `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message || '')}`
      : '#';

  return (
    <div>
      <h1 className="text-2xl font-black text-dark-900 mb-6">WhatsApp Settings</h1>

      <div className="max-w-xl bg-white rounded-2xl border border-dark-200 p-5">
        <div className="flex items-center gap-2 mb-5">
          <MessageCircle size={20} className="text-green-600" />
          <h2 className="font-bold text-dark-900">Contact Settings</h2>
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
            <Input
              label="WhatsApp Phone Number"
              required
              placeholder="6281234567890"
              hint="Include country code without + (e.g. 6281234567890)"
              error={errors.phoneNumber?.message}
              {...register('phoneNumber', {
                required: 'Phone number is required',
                pattern: {
                  value: /^\d{10,15}$/,
                  message: 'Enter a valid phone number (digits only)',
                },
              })}
            />

            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">
                Default Message
              </label>
              <textarea
                rows={4}
                placeholder="Hi! I have a question about..."
                className="w-full px-3 py-2 border border-dark-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 resize-none"
                {...register('defaultMessage')}
              />
            </div>

            {phone && (
              <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                <p className="text-xs text-green-700 font-medium mb-1">Preview link:</p>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-green-600 underline break-all"
                >
                  {previewUrl}
                </a>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

export default AdminWhatsappPage;
