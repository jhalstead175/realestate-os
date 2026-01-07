'use client';

import { PropertySearchFilters } from '@realestate-os/shared';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Bell, Mail, Calendar } from 'lucide-react';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface SaveSearchModalProps {
  filters: PropertySearchFilters;
  isOpen: boolean;
  onClose: () => void;
}

export function SaveSearchModal({ filters, isOpen, onClose }: SaveSearchModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    emailAlerts: true,
    frequency: 'daily' as 'realtime' | 'daily' | 'weekly',
    notifyViaEmail: true,
    notifyViaSms: false
  });

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // TODO: Handle unauthenticated users
        return;
      }

      // Save search to database
      const { error } = await supabase
        .from('saved_searches')
        .insert({
          name: formData.name || 'My Saved Search',
          user_id: user.id,
          filters,
          email_alerts: formData.emailAlerts,
          frequency: formData.frequency,
          notify_via_email: formData.notifyViaEmail,
          notify_via_sms: formData.notifyViaSms
        });

      if (error) throw error;

      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setFormData({
          name: '',
          emailAlerts: true,
          frequency: 'daily',
          notifyViaEmail: true,
          notifyViaSms: false
        });
      }, 2000);

    } catch (error) {
      console.error('Error saving search:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate a descriptive name based on filters
  const generateSearchName = () => {
    const parts = [];
    if (filters.minPrice || filters.maxPrice) {
      parts.push(`${filters.minPrice || 0}-${filters.maxPrice || '∞'}`);
    }
    if (filters.bedrooms) {
      parts.push(`${filters.bedrooms}+ beds`);
    }
    if (filters.propertyType) {
      parts.push(filters.propertyType.replace('_', ' '));
    }
    if (filters.cities?.[0]) {
      parts.push(filters.cities[0]);
    }
    return parts.length > 0 ? parts.join(' · ') : 'My Property Search';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">
            <Bell className="inline h-5 w-5 mr-2" />
            Save Search & Get Alerts
          </DialogTitle>
        </DialogHeader>

        {isSuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="text-green-600 text-2xl">✓</div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Search Saved!</h3>
            <p className="text-gray-600">
              You'll receive email alerts when new properties match your criteria.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Search Preview */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Search Criteria</h4>
              <div className="space-y-1 text-sm">
                {filters.propertyType && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Property Type:</span>
                    <span className="font-medium">{filters.propertyType.replace('_', ' ')}</span>
                  </div>
                )}
                {(filters.minPrice || filters.maxPrice) && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price Range:</span>
                    <span className="font-medium">
                      ${(filters.minPrice || 0).toLocaleString()} - ${(filters.maxPrice || '∞').toLocaleString()}
                    </span>
                  </div>
                )}
                {filters.bedrooms && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bedrooms:</span>
                    <span className="font-medium">{filters.bedrooms}+</span>
                  </div>
                )}
                {filters.cities?.[0] && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">{filters.cities[0]}, {filters.states?.[0]}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Search Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Search Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={generateSearchName()}
              />
              <p className="text-xs text-gray-500">
                Give this search a name to easily identify it later
              </p>
            </div>

            {/* Alert Frequency */}
            <div className="space-y-3">
              <Label>Alert Frequency</Label>
              <RadioGroup
                value={formData.frequency}
                onValueChange={(value) => setFormData({ ...formData, frequency: value as any })}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="realtime" id="realtime" />
                  <Label htmlFor="realtime" className="cursor-pointer">
                    Real-time
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="daily" id="daily" />
                  <Label htmlFor="daily" className="cursor-pointer">
                    Daily Digest
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="weekly" id="weekly" />
                  <Label htmlFor="weekly" className="cursor-pointer">
                    Weekly Digest
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Notification Methods */}
            <div className="space-y-3">
              <Label>Send Alerts Via</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="notifyViaEmail"
                    checked={formData.notifyViaEmail}
                    onChange={(e) => setFormData({ ...formData, notifyViaEmail: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="notifyViaEmail" className="flex items-center cursor-pointer">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="notifyViaSms"
                    checked={formData.notifyViaSms}
                    onChange={(e) => setFormData({ ...formData, notifyViaSms: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="notifyViaSms" className="flex items-center cursor-pointer">
                    <Calendar className="h-4 w-4 mr-2" />
                    SMS
                  </Label>
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              You can manage your saved searches and notification preferences in your account settings.
            </div>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Search'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}