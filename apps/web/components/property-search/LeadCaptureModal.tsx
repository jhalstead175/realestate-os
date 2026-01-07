'use client';

import { Property } from '@realestate-os/shared';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Phone, Mail, User, MessageSquare, Calendar } from 'lucide-react';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatPrice } from '@/lib/utils';

interface LeadCaptureModalProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
}

export function LeadCaptureModal({ property, isOpen, onClose }: LeadCaptureModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: `Hi, I'm interested in ${property.address}. Can you please send me more information?`,
    preferredTime: '',
    source: 'property_inquiry'
  });

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create lead in Supabase
      const { data: lead, error } = await supabase
        .from('leads')
        .insert({
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          source: formData.source,
          status: 'new',
          lead_score: 10, // Base score for property inquiry
          budget_min: property.listing_price * 0.9,
          budget_max: property.listing_price * 1.1,
          preferred_locations: [`${property.city}, ${property.state}`],
          notes: formData.message,
          assigned_to: property.created_by // Assign to listing agent
        })
        .select()
        .single();

      if (error) throw error;

      // Create communication record
      await supabase
        .from('communications')
        .insert({
          lead_id: lead.id,
          type: 'email',
          direction: 'inbound',
          subject: `Inquiry about ${property.address}`,
          content: formData.message,
          metadata: {
            property_id: property.id,
            property_address: property.address,
            property_price: property.listing_price
          }
        });

      // TODO: Send email notification to agent using Resend
      // TODO: Trigger automation workflow

      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          message: `Hi, I'm interested in ${property.address}. Can you please send me more information?`,
          preferredTime: '',
          source: 'property_inquiry'
        });
      }, 2000);

    } catch (error) {
      console.error('Error creating lead:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Interested in this property?
          </DialogTitle>
        </DialogHeader>

        {isSuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="text-green-600 text-2xl">✓</div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Message Sent!</h3>
            <p className="text-gray-600">
              An agent will contact you shortly about {property.address}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Property Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-start space-x-3">
                {property.images[0] && (
                  <img
                    src={property.images[0]}
                    alt={property.address}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                <div>
                  <div className="font-semibold line-clamp-1">{property.address}</div>
                  <div className="text-sm text-gray-600">
                    {property.city}, {property.state}
                  </div>
                  <div className="text-lg font-bold text-green-600">
                    {formatPrice(property.listing_price)}
                  </div>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message to Agent</Label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="pl-10 min-h-[100px]"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredTime">Best Time to Contact</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="preferredTime"
                  placeholder="e.g., Weekdays after 5 PM"
                  value={formData.preferredTime}
                  onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="text-xs text-gray-500">
              By submitting, you agree to be contacted by a real estate agent regarding this property.
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
                {isSubmitting ? 'Sending...' : 'Contact Agent'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}