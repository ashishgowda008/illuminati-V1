import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  IndianRupee,
  Calendar,
  FileText,
  Target,
  Building2,
  Mail,
  Phone,
  Send,
  Users,
  Award,
  Clock,
  Image,
  ChevronRight,
  ChevronLeft,
  Upload,
  CheckCircle,
  Info,
  AlertCircle,
  Bell,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  School
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  message: string;
  type: 'status_change' | 'change_request' | 'reminder' | 'feedback';
  created_at: string;
  read_at: string | null;
  action_url?: string;
  sponsorship_id: string;
}

interface UniversitySponsorshipRequest {
  id: string;
  created_at: string;
  description: string;
  amount: string;
  event_date: string;
  event_category: string;
  status: string;
  university_id: string;
  university_name: string;
  university_url: string;
  feedback?: string;
}

interface UniversityProfile {
  id: string;
  username: string;
  university_name: string;
  website: string;
  location: string;
  type: string;
  description: string;
  contact_email: string;
  contact_phone: string;
  social_media: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
  };
  address: string;
  logo: string;
}

const SubmitSponsorship = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [activeSlide, setActiveSlide] = useState<'profile' | 'sponsorship' | 'packages' | 'requests'>('profile');
  const [profileComplete, setProfileComplete] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const username = localStorage.getItem('username');
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
  // Add these at the top with other state variables
  const [selectedSponsorship, setSelectedSponsorship] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [editableSponsorship, setEditableSponsorship] = useState({
    title: '',
    description: '',
    amount: '',
    requirements: '',
    targetCriteria: '',
    eventDate: '',
    eventCategory: 'Tech Fest',
    expectedFootfall: '',
    applicationDeadline: ''
  });

  // University requests states
  const [universityRequests, setUniversityRequests] = useState<UniversitySponsorshipRequest[]>([]);
  const [selectedUniversityRequest, setSelectedUniversityRequest] = useState<UniversitySponsorshipRequest | null>(null);
  const [selectedUniversityProfile, setSelectedUniversityProfile] = useState<UniversityProfile | null>(null);
  const [showUniversityModal, setShowUniversityModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [userProfileId, setUserProfileId] = useState<string | null>(null);

  // Add after your imports
  const styles = {
    hideScrollbar: {
      scrollbarWidth: 'none' as const,
      msOverflowStyle: 'none' as const,
      '::-webkit-scrollbar': {
        display: 'none',
      } as React.CSSProperties,
      WebkitOverflowScrolling: 'touch' as const,
    },
  };
  const [profileData, setProfileData] = useState({
    brand_name: '',
    logo: '',
    website: '',
    industry: 'Tech',
    company_size: '',
    description: '',
    contact_email: '',
    contact_phone: '',
    social_media: {
      linkedin: '',
      twitter: '',
      instagram: ''
    },
    billing_address: '',
    max_offering: ''
  });

  const [sponsorships, setSponsorships] = useState<Array<{
    id: string;
    title: string;
    description: string;
    amount: number;
    status: string;
  }>>([]);

  const openSponsorshipModal = async (sponsorshipId: string) => {
    try {
      const { data, error } = await supabase
        .from('sponsorship_requests')
        .select('*')
        .eq('id', sponsorshipId)
        .single();
        
      if (error) throw error;
      
      setSelectedSponsorship(data);
      setEditableSponsorship({
        title: data.title,
        description: data.description,
        amount: data.amount.toString(),
        requirements: data.requirements,
        targetCriteria: data.target_criteria,
        eventDate: data.event_date,
        eventCategory: data.event_category,
        expectedFootfall: data.expected_footfall.toString(),
        applicationDeadline: data.application_deadline
      });
      setShowModal(true);
    } catch (error) {
      console.error('Error loading sponsorship details:', error);
      toast.error('Failed to load sponsorship details');
    }
  };

  const openUniversityRequestModal = async (request: UniversitySponsorshipRequest) => {
    try {
      setSelectedUniversityRequest(request);
      
      // Fetch university profile details
      const { data: universityProfile, error: universityError } = await supabase
        .from('university_profiles')
        .select('*')
        .eq('id', request.university_id)
        .single();
        
      if (universityError) throw universityError;
      
      setSelectedUniversityProfile(universityProfile);
      setShowUniversityModal(true);
    } catch (error) {
      console.error('Error loading university details:', error);
      toast.error('Failed to load university details');
    }
  };

  const handleEditableSponsorshipChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditableSponsorship(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadSponsorships();
    await loadUniversityRequests();
    setIsRefreshing(false);
  };

  const handleSponsorshipUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
  
    try {
      const { error: updateError } = await supabase
        .from('sponsorship_requests')
        .update({
          title: editableSponsorship.title,
          description: editableSponsorship.description,
          amount: parseFloat(editableSponsorship.amount),
          requirements: editableSponsorship.requirements,
          target_criteria: editableSponsorship.targetCriteria,
          event_date: editableSponsorship.eventDate,
          event_category: editableSponsorship.eventCategory,
          expected_footfall: parseInt(editableSponsorship.expectedFootfall),
          application_deadline: editableSponsorship.applicationDeadline,
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedSponsorship.id);
  
      if (updateError) throw updateError;
      
      toast.success('Sponsorship updated successfully!');
      setSuccess(true);
      setShowModal(false);
      
      // Reload sponsorships
      await loadSponsorships();
      
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error: any) {
      console.error('Update error:', error);
      setError(error.message || 'Failed to update sponsorship');
      toast.error(error.message || 'Failed to update sponsorship');
    } finally {
      setLoading(false);
    }
  };

  const loadSponsorships = async () => {
    try {
      console.log('Starting sponsorship data load...');
      
      // Use username from localStorage
      if (!username) {
        console.error('Username not found in localStorage');
        return;
      }
      console.log('Using username from localStorage:', username);

      // Get user's brand profile using username
      const { data: brandProfile, error: profileError } = await supabase
        .from('brand_profiles')
        .select('id')
        .eq('username', username)
        .single();
      
      console.log('Brand profile data:', { brandProfile, profileError });
        
      if (profileError || !brandProfile?.id) {
        console.error('Brand profile not found');
        return;
      }
      
      // Store the profile ID for later use
      setUserProfileId(brandProfile.id);

      // Query sponsorships
      const { data: sponsorshipsData, error } = await supabase
        .from('sponsorship_requests')
        .select('id, title, description, amount, status')
        .eq('user_id', brandProfile.id);

      console.log('Sponsorships data:', {
        count: sponsorshipsData?.length,
        sponsorships: sponsorshipsData,
        error
      });

      if (error) throw error;
      setSponsorships(sponsorshipsData || []);
      
      console.log('Sponsorship load complete');
    } catch (error) {
      console.error('Error loading sponsorships:', error);
      toast.error('Failed to load sponsorships');
    }
  };

  const loadUniversityRequests = async () => {
    console.log('Starting to load university requests...');
    try {
      console.log('Starting university requests load...');
      
      if (!username) {
        console.error('Username not found in localStorage');
        return;
      }
      
      // Get user's brand profile using username
      const { data: brandProfile, error: profileError } = await supabase
        .from('brand_profiles')
        .select('id')
        .eq('username', username)
        .single();
      
      if (profileError || !brandProfile?.id) {
        console.error('Brand profile not found');
        return;
      }
      console.log('Brand profile for university requests:', brandProfile);
      console.log('Querying university requests for company ID:', brandProfile.id);
      // Query university requests for this company
      const { data: requestsData, error } = await supabase
        .from('sponsership_requests_university')
        .select('*')
        .eq('company_id', brandProfile.id)
        .eq('status', 'approved');

      console.log('University requests data:', {
        count: requestsData?.length,
        requests: requestsData,
        error
      });

      if (error) throw error;
      setUniversityRequests(requestsData || []);
      
      console.log('University requests load complete');
    } catch (error) {
      console.error('Error loading university requests:', error);
      toast.error('Failed to load university requests');
    }
  };

  // Handle university request actions
  const handleAcceptRequest = async () => {
    if (!selectedUniversityRequest) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('sponsership_requests_university')
        .update({
          status: 'accepted',
          accepted_by: username,
          review_date: new Date().toISOString()
        })
        .eq('id', selectedUniversityRequest.id);
        
      if (error) throw error;
      
      toast.success('Sponsorship request accepted!');
      setShowUniversityModal(false);
      await loadUniversityRequests();
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Failed to accept request');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!selectedUniversityRequest) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('sponsership_requests_university')
        .update({
          status: 'rejected',
          reviewer_id: username,
          review_date: new Date().toISOString()
        })
        .eq('id', selectedUniversityRequest.id);
        
      if (error) throw error;
      
      toast.success('Sponsorship request rejected');
      setShowUniversityModal(false);
      await loadUniversityRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestChanges = () => {
    setShowFeedbackModal(true);
  };

  const handleSubmitFeedback = async () => {
    if (!selectedUniversityRequest || !feedbackMessage.trim()) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('sponsership_requests_university')
        .update({
          status: 'changes_requested',
          reviewer_id: username,
          review_date: new Date().toISOString(),
          feedback: feedbackMessage
        })
        .eq('id', selectedUniversityRequest.id);
        
      if (error) throw error;
      
      toast.success('Change request sent to university');
      setShowFeedbackModal(false);
      setShowUniversityModal(false);
      setFeedbackMessage('');
      await loadUniversityRequests();
    } catch (error) {
      console.error('Error requesting changes:', error);
      toast.error('Failed to send change request');
    } finally {
      setLoading(false);
    }
  };

  // Add loadSponsorships to useEffect
  useEffect(() => {
    if (isAuthenticated) {
      loadSponsorships();
      loadUniversityRequests();
    }
  }, [isAuthenticated]);

  // Add this with your other useEffect hooks
  useEffect(() => {
    if (showModal || showUniversityModal || showFeedbackModal) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [showModal, showUniversityModal, showFeedbackModal]);

  const [sponsorshipData, setSponshorshipData] = useState({
    title: '',
    description: '',
    amount: '',
    requirements: '',
    targetCriteria: '',
    eventDate: '',
    eventCategory: 'Tech Fest',
    expectedFootfall: '',
    applicationDeadline: ''
  });

  useEffect(() => {
    if (!isAuthenticated || !username) {
      navigate('/signin');
      return;
    }
    loadProfileData();
    loadNotifications();

    // Set up real-time notification subscription
    const channel = supabase
      .channel('sponsorship_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sponsorship_notifications'
        },
        async (payload) => {
          if (payload.new.recipient_id === username) {
            console.log('New notification received:', payload.new);
            setNotifications(prev => [payload.new as unknown as Notification, ...prev]);
            setUnreadCount(prev => prev + 1);
            toast.success(payload.new.message);
          }
        }
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [isAuthenticated, username, navigate]);

  const loadNotifications = async () => {
    try {
      if (!username) {
        console.error('Username not found in localStorage');
        return;
      }
      console.log('Loading notifications for username:', username);

      const { data: notifs, error } = await supabase
        .from('sponsorship_notifications')
        .select('*')
        .eq('recipient_id', username)
        .order('created_at', { ascending: false });

      console.log('Notifications data:', {
        count: notifs?.length,
        notifications: notifs,
        error
      });

      if (error) throw error;

      setNotifications(notifs || []);
      setUnreadCount(notifs?.filter(n => !n.read_at).length || 0);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('sponsorship_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const loadProfileData = async () => {
    try {
      if (!username) {
        throw new Error('Not authenticated. Please sign in.');
      }

      const { data: profile, error: profileError } = await supabase
        .from('brand_profiles')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profile) {
        setProfileData({
          brand_name: profile.brand_name || '',
          logo: profile.logo || '',
          website: profile.website || '',
          industry: profile.industry || 'Tech',
          company_size: profile.company_size || '',
          description: profile.description || '',
          contact_email: profile.contact_email || '',
          contact_phone: profile.contact_phone || '',
          social_media: profile.social_media || {
            linkedin: '',
            twitter: '',
            instagram: ''
          },
          billing_address: profile.billing_address || '',
          max_offering: profile.max_offering || ''
        });
        setProfileComplete(profile.is_complete || false);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile data. Please refresh and try again.');
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const reader = new FileReader();
        reader.onload = async (event) => {
          if (event.target?.result) {
            setProfileData(prev => ({
              ...prev,
              logo: event.target!.result as string
            }));
          }
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Error processing logo:', error);
        setError('Failed to process logo image');
      }
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: updateError } = await supabase
        .from('brand_profiles')
        .upsert({
          username: username,
          brand_name: profileData.brand_name,
          logo: profileData.logo,
          website: profileData.website,
          industry: profileData.industry,
          company_size: profileData.company_size,
          description: profileData.description,
          contact_email: profileData.contact_email,
          contact_phone: profileData.contact_phone,
          social_media: profileData.social_media,
          billing_address: profileData.billing_address,
          max_offering: parseFloat(profileData.max_offering) || 0,
          is_complete: true,
          updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;

      toast.success('Profile updated successfully!');
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);

      await loadProfileData();
      
      if (profileComplete) {
        setActiveSlide('sponsorship');
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      setError(error.message || 'Failed to update profile. Please try again.');
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSponsorshipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: profile, error: profileError } = await supabase
        .from('brand_profiles')
        .select('is_complete')
        .eq('username', username)
        .maybeSingle();

      if (profileError) throw profileError;
      
      if (!profile || !profile.is_complete) {
        throw new Error('Please complete your profile before submitting sponsorship');
      }

      // Get current authenticated user
      if (!isAuthenticated || !username) {
        throw new Error('User not authenticated. Please sign in again.');
      }

      // Get user's brand profile ID
      const { data: brandProfile, error: brandProfileError } = await supabase
        .from('brand_profiles')
        .select('id')
        .eq('username', username)
        .single();
        
      if (brandProfileError || !brandProfile) throw new Error('Brand profile not found. Please complete your profile first.');
        
      const { data: submission, error: submitError } = await supabase
        .from('sponsorship_requests')
        .insert([
          {
            user_id: brandProfile.id, // Use profile ID consistently
            title: sponsorshipData.title,
            description: sponsorshipData.description,
            amount: parseFloat(sponsorshipData.amount),
            requirements: sponsorshipData.requirements,
            target_criteria: sponsorshipData.targetCriteria,
            event_date: sponsorshipData.eventDate,
            event_category: sponsorshipData.eventCategory,
            expected_footfall: parseInt(sponsorshipData.expectedFootfall),
            application_deadline: sponsorshipData.applicationDeadline,
            status: 'pending'
          }
        ])
        .select()
        .single();

      if (submitError) throw submitError;

      // Create initial notification
      await supabase
        .from('sponsorship_notifications')
        .insert([
          {
            sponsorship_id: submission.id,
            recipient_id: username || '',
            type: 'status_change',
            message: 'Your sponsorship request has been submitted and is pending review.',
            action_url: `/sponsorships/${submission.id}`
          }
        ]);

      toast.success('Sponsorship submitted successfully!');
      setSuccess(true);
      setTimeout(() => {
        navigate('/sponsorships');
      }, 3000);
    } catch (error: any) {
      console.error('Submission error:', error);
      setError(error.message || 'Failed to submit sponsorship');
      toast.error(error.message || 'Failed to submit sponsorship');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('social_media.')) {
      const socialField = name.split('.')[1];
      setProfileData(prev => ({
        ...prev,
        social_media: {
          ...prev.social_media,
          [socialField]: value
        }
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSponsorshipChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSponshorshipData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  
  const renderProfileForm = () => (
    <form onSubmit={handleProfileSubmit} className="space-y-6">
      <div>
        <label htmlFor="brand_name" className="block text-sm font-medium text-gray-300 mb-1">
          Brand Name
        </label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            id="brand_name"
            name="brand_name"
            type="text"
            value={profileData.brand_name}
            onChange={handleProfileChange}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none focus:ring-1 focus:ring-neon-green/40"
            placeholder="Enter your brand name"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="logo" className="block text-sm font-medium text-gray-300 mb-1">
          Brand Logo
        </label>
        <div className="relative">
          <Image className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            id="logo"
            name="logo"
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none focus:ring-1 focus:ring-neon-green/40"
          />
        </div>
        {profileData.logo && (
          <div className="mt-2">
            <img src={profileData.logo} alt="Brand Logo" className="h-20 w-20 object-contain" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="website" className="block text-sm font-medium text-gray-300 mb-1">
            Website
          </label>
          <input
            id="website"
            name="website"
            type="url"
            value={profileData.website}
            onChange={handleProfileChange}
            className="w-full px-4 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none focus:ring-1 focus:ring-neon-green/40"
            placeholder="https://example.com"
            required
          />
        </div>

        <div>
          <label htmlFor="industry" className="block text-sm font-medium text-gray-300 mb-1">
            Industry
          </label>
          <select
            id="industry"
            name="industry"
            value={profileData.industry}
            onChange={handleProfileChange}
            className="w-full px-4 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none focus:ring-1 focus:ring-neon-green/40"
            required
          >
            <option value="Tech" className="bg-black">Tech</option>
            <option value="Fashion" className="bg-black">Fashion</option>
            <option value="FMCG" className="bg-black">FMCG</option>
            <option value="EdTech" className="bg-black">EdTech</option>
            <option value="Finance" className="bg-black">Finance</option>
            <option value="Entertainment" className="bg-black">Entertainment</option>
            <option value="Food & Beverage" className="bg-black">Food & Beverage</option>
            <option value="Healthcare" className="bg-black">Healthcare</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="company_size" className="block text-sm font-medium text-gray-300 mb-1">
          Company Size
        </label>
        <select
          id="company_size"
          name="company_size"
          value={profileData.company_size}
          onChange={handleProfileChange}
          className="w-full px-4 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none focus:ring-1 focus:ring-neon-green/40"
          required
        >
          <option value="" disabled className="bg-black">Select company size</option>
          <option value="1-10" className="bg-black">1-10 employees</option>
          <option value="11-50" className="bg-black">11-50 employees</option>
          <option value="51-200" className="bg-black">51-200 employees</option>
          <option value="201-500" className="bg-black">201-500 employees</option>
          <option value="501+" className="bg-black">501+ employees</option>
        </select>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
          Company Description
        </label>
        <textarea
                    id="description"
                    name="description"
                    value={profileData.description}
                    onChange={handleProfileChange}
                    rows={4}
                    className="w-full px-4 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none focus:ring-1 focus:ring-neon-green/40"
                    placeholder="Describe your company"
                    required
                  />
                </div>
          
                <div>
                  <label htmlFor="max_offering" className="block text-sm font-medium text-gray-300 mb-1">
                    Maximum Sponsorship Offering (₹)
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="max_offering"
                      name="max_offering"
                      type="number"
                      value={profileData.max_offering}
                      onChange={handleProfileChange}
                      className="w-full pl-10 pr-4 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none focus:ring-1 focus:ring-neon-green/40"
                      placeholder="Enter maximum amount you're willing to offer"
                      required
                    />
                  </div>
                </div>
          
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="contact_email" className="block text-sm font-medium text-gray-300 mb-1">
                      Contact Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        id="contact_email"
                        name="contact_email"
                        type="email"
                        value={profileData.contact_email}
                        onChange={handleProfileChange}
                        className="w-full pl-10 pr-4 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none focus:ring-1 focus:ring-neon-green/40"
                        placeholder="Enter contact email"
                        required
                      />
                    </div>
                  </div>
          
                  <div>
                    <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-300 mb-1">
                      Contact Phone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        id="contact_phone"
                        name="contact_phone"
                        type="tel"
                        value={profileData.contact_phone}
                        onChange={handleProfileChange}
                        className="w-full pl-10 pr-4 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none focus:ring-1 focus:ring-neon-green/40"
                        placeholder="Enter contact phone"
                        required
                      />
                    </div>
                  </div>
                </div>
          
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Social Media Links
                  </label>
                  <div className="space-y-3">
                    <input
                      name="social_media.linkedin"
                      type="url"
                      value={profileData.social_media.linkedin}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none focus:ring-1 focus:ring-neon-green/40"
                      placeholder="LinkedIn URL"
                    />
                    <input
                      name="social_media.twitter"
                      type="url"
                      value={profileData.social_media.twitter}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none focus:ring-1 focus:ring-neon-green/40"
                      placeholder="Twitter URL"
                    />
                    <input
                      name="social_media.instagram"
                      type="url"
                      value={profileData.social_media.instagram}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none focus:ring-1 focus:ring-neon-green/40"
                      placeholder="Instagram URL"
                    />
                  </div>
                </div>
          
                <div>
                  <label htmlFor="billing_address" className="block text-sm font-medium text-gray-300 mb-1">
                    Billing Address
                  </label>
                  <textarea
                    id="billing_address"
                    name="billing_address"
                    value={profileData.billing_address}
                    onChange={handleProfileChange}
                    rows={3}
                    className="w-full px-4 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none focus:ring-1 focus:ring-neon-green/40"
                    placeholder="Enter billing address"
                    required
                  />
                </div>
          
                {error && (
                  <div className="text-red-500 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    {error}
                  </div>
                )}
          
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-neon-green text-black rounded-lg font-semibold hover:bg-[#00CC00] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? 'Updating...' : (
                    <>
                      Update Profile <Upload size={20} />
                    </>
                  )}
                </button>
              </form>
            );
          
            const renderSponsorshipForm = () => (
              <form onSubmit={handleSponsorshipSubmit} className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">
                    Sponsorship Title
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="title"
                      name="title"
                      type="text"
                      value={sponsorshipData.title}
                      onChange={handleSponsorshipChange}
                      className="w-full pl-10 pr-4 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none focus:ring-1 focus:ring-neon-green/40"
                      placeholder="Enter sponsorship title"
                      required
                    />
                  </div>
                </div>
          
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={sponsorshipData.description}
                    onChange={handleSponsorshipChange}
                    rows={4}
                    className="w-full px-4 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none focus:ring-1 focus:ring-neon-green/40"
                    placeholder="Describe your sponsorship opportunity"
                    required
                  />
                </div>
          
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-1">
                      Sponsorship Amount (₹)
                    </label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        id="amount"
                        name="amount"
                        type="number"
                        value={sponsorshipData.amount}
                        onChange={handleSponsorshipChange}
                        className="w-full pl-10 pr-4 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none focus:ring-1 focus:ring-neon-green/40"
                        placeholder="Enter amount"
                        required
                      />
                    </div>
                  </div>
          
                  <div>
                    <label htmlFor="eventCategory" className="block text-sm font-medium text-gray-300 mb-1">
                      Event Category
                    </label>
                    <div className="relative">
                      <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <select
                        id="eventCategory"
                        name="eventCategory"
                        value={sponsorshipData.eventCategory}
                        onChange={handleSponsorshipChange}
                        className="w-full pl-10 pr-4 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none focus:ring-1 focus:ring-neon-green/40"
                        required
                      >
                        <option value="Tech Fest" className="bg-black">Tech Fest</option>
                        <option value="Cultural Fest" className="bg-black">Cultural Fest</option>
                        <option value="Sports Meet" className="bg-black">Sports Meet</option>
                        <option value="Business Summit" className="bg-black">Business Summit</option>
                        <option value="Hackathon" className="bg-black">Hackathon</option>
                        <option value="Workshop Series" className="bg-black">Workshop Series</option>
                        <option value="Conference" className="bg-black">Conference</option>
                      </select>
                    </div>
                  </div>
                </div>
          
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="eventDate" className="block text-sm font-medium text-gray-300 mb-1">
                      Event Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        id="eventDate"
                        name="eventDate"
                        type="date"
                        value={sponsorshipData.eventDate}
                        onChange={handleSponsorshipChange}
                        className="w-full pl-10 pr-4 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none focus:ring-1 focus:ring-neon-green/40"
                        required
                      />
                    </div>
                  </div>
          
                  <div>
                    <label htmlFor="applicationDeadline" className="block text-sm font-medium text-gray-300 mb-1">
                      Application Deadline
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        id="applicationDeadline"
                        name="applicationDeadline"
                        type="date"
                        value={sponsorshipData.applicationDeadline}
                        onChange={handleSponsorshipChange}
                        className="w-full pl-10 pr-4 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none focus:ring-1 focus:ring-neon-green/40"
                        required
                      />
                    </div>
                  </div>
                </div>
          
                <div>
                  <label htmlFor="requirements" className="block text-sm font-medium text-gray-300 mb-1">
                    Sponsorship Requirements
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                    <textarea
                      id="requirements"
                      name="requirements"
                      value={sponsorshipData.requirements}
                      onChange={handleSponsorshipChange}
                      rows={3}
                      className="w-full pl-10 pr-4 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none focus:ring-1 focus:ring-neon-green/40"
                      placeholder="Detail what you require from sponsorship applicants"
                      required
                    />
                  </div>
                </div>
          
                <div>
                  <label htmlFor="targetCriteria" className="block text-sm font-medium text-gray-300 mb-1">
                    Target Audience Criteria
                  </label>
                  <div className="relative">
                    <Target className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                    <textarea
                      id="targetCriteria"
                      name="targetCriteria"
                      value={sponsorshipData.targetCriteria}
                      onChange={handleSponsorshipChange}
                      rows={3}
                      className="w-full pl-10 pr-4 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none focus:ring-1 focus:ring-neon-green/40"
                      placeholder="Describe your target audience criteria"
                      required
                    />
                  </div>
                </div>
          
                <div>
                  <label htmlFor="expectedFootfall" className="block text-sm font-medium text-gray-300 mb-1">
                    Expected Footfall
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="expectedFootfall"
                      name="expectedFootfall"
                      type="number"
                      value={sponsorshipData.expectedFootfall}
                      onChange={handleSponsorshipChange}
                      className="w-full pl-10 pr-4 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none focus:ring-1 focus:ring-neon-green/40"
                      placeholder="Enter expected number of attendees"
                      required
                    />
                  </div>
                </div>
          
                {error && (
                  <div className="text-red-500 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    {error}
                  </div>
                )}
          
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-neon-green text-black rounded-lg font-semibold hover:bg-[#00CC00] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? 'Submitting...' : (
                    <>
                      Submit Sponsorship <Send size={20} />
                    </>
                  )}
                </button>
              </form>
            );
          
            const getStatusColor = (status: string) => {
              switch (status) {
                case 'approved':
                  return 'text-green-400 border-green-400/40';
                case 'rejected':
                  return 'text-red-400 border-red-400/40';
                case 'under_review':
                  return 'text-yellow-400 border-yellow-400/40';
                case 'changes_requested':
                  return 'text-orange-400 border-orange-400/40';
                default:
                  return 'text-blue-400 border-blue-400/40';
              }
            };
          
            const renderPackagesCards = () => (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sponsorships.map((sponsorship) => (
                  <div
                    key={sponsorship.id}
                    className="bg-white/5 border border-neon-green/20 rounded-lg p-6 hover:border-neon-green/40 transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-semibold text-white">{sponsorship.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(sponsorship.status)}`}>
                        {sponsorship.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-neon-green mb-4">₹{sponsorship.amount.toLocaleString()}</p>
                    <p className="text-gray-300 mb-4">{sponsorship.description}</p>
                    <button
                      onClick={() => openSponsorshipModal(sponsorship.id)}
                      className="w-full mt-6 py-2 bg-neon-green/10 border border-neon-green text-neon-green rounded-lg font-semibold hover:bg-neon-green hover:text-black transition-all"
                    >
                      View Details
                    </button>
                  </div>
                ))}
                {sponsorships.length === 0 && (
                  <div className="col-span-2 text-center py-8">
                    <p className="text-gray-400">No sponsorships found. Create one from the Sponsorship Details tab.</p>
                  </div>
                )}
              </div>
            );
          
            const renderUniversityRequests = () => (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {universityRequests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-white/5 border border-neon-green/20 rounded-lg p-6 hover:border-neon-green/40 transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-semibold text-white">{request.university_name}</h3>
                      <span className="px-3 py-1 rounded-full text-sm border text-green-400 border-green-400/40">
                        Request for Sponsorship
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-neon-green mb-4">₹{parseFloat(request.amount).toLocaleString()}</p>
                    <div className="flex items-center gap-2 text-gray-300 mb-2">
                      <Calendar className="w-4 h-4" />
                      <p>Event Date: {new Date(request.event_date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300 mb-4">
                      <Award className="w-4 h-4" />
                      <p>Category: {request.event_category}</p>
                    </div>
                    <button
                      onClick={() => openUniversityRequestModal(request)}
                      className="w-full mt-6 py-2 bg-neon-green/10 border border-neon-green text-neon-green rounded-lg font-semibold hover:bg-neon-green hover:text-black transition-all"
                    >
                      View Details
                    </button>
                  </div>
                ))}
                {universityRequests.length === 0 && (
                  <div className="col-span-2 text-center py-8">
                    <p className="text-gray-400">No university sponsorship requests found.</p>
                  </div>
                )}
              </div>
            );
          
            const renderSponsorshipModal = () => {
              if (!selectedSponsorship) return null;
              
              const isEditable = selectedSponsorship.status === 'changes_requested';
              
              return (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80">
                  <div 
                    className="bg-black border border-neon-green/30 rounded-xl p-6 max-w-2xl w-full max-h-[78vh] overflow-y-auto"
                    style={{
                      ...styles.hideScrollbar,
                      overscrollBehavior: 'contain'
                    }}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-bold text-white">Sponsorship Details</h2>
                      <button 
                        onClick={() => setShowModal(false)}
                        className="text-gray-400 hover:text-white"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                    
                    <div className="mb-6">
                      <div className="flex justify-between items-center">
                        <span className={`px-3 py-1 mb-4 rounded-full text-sm border ${getStatusColor(selectedSponsorship.status)}`}>
                          Status: {selectedSponsorship.status.replace('_', ' ')}
                        </span>
                        <p className="text-xl font-bold text-neon-green">₹{parseFloat(selectedSponsorship.amount).toLocaleString()}</p>
                      </div>
                      
                      {selectedSponsorship.feedback && (
                        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
                          <h3 className="text-lg font-semibold text-blue-300 mb-2 flex items-center">
                            <AlertCircle className="mr-2 h-5 w-5" /> Admin Feedback
                          </h3>
                          <p className="text-blue-100">{selectedSponsorship.feedback}</p>
                        </div>
                      )}
                      
                      {isEditable ? (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
                          <p className="text-yellow-200 flex items-center">
                            <Info className="mr-2 h-5 w-5" />
                            Changes have been requested. Update the sponsorship details and submit again.
                          </p>
                        </div>
                      ) : selectedSponsorship.status !== 'approved' && (
                        <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-4 mb-6">
                          <p className="text-gray-300 flex items-center">
                            <Info className="mr-2 h-5 w-5" />
                            This sponsorship cannot be edited in its current status.
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <form onSubmit={handleSponsorshipUpdate} className="space-y-6">
                      <div>
                        <label htmlFor="modal-title" className="block text-sm font-medium text-gray-300 mb-1">
                          Title
                        </label>
                        <input
                          id="modal-title"
                          name="title"
                          type="text"
                          value={editableSponsorship.title}
                          onChange={handleEditableSponsorshipChange}
                          className={`w-full px-4 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none focus:ring-1 focus:ring-neon-green/40 ${!isEditable ? 'opacity-70 cursor-not-allowed' : ''}`}
                          disabled={!isEditable}
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="modal-description" className="block text-sm font-medium text-gray-300 mb-1">
                          Description
                        </label>
                        <textarea
                          id="modal-description"
                          name="description"
                          value={editableSponsorship.description}
                          onChange={handleEditableSponsorshipChange}
                          rows={4}
                          className={`w-full px-4 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none focus:ring-1 focus:ring-neon-green/40 ${!isEditable ? 'opacity-70 cursor-not-allowed' : ''}`}
                          disabled={!isEditable}
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="modal-amount" className="block text-sm font-medium text-gray-300 mb-1">
                            Amount (₹)
                          </label>
                          <input
                            id="modal-amount"
                            name="amount"
                            type="number"
                            value={editableSponsorship.amount}
                            onChange={handleEditableSponsorshipChange}
                            className={`w-full px-4 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none focus:ring-1 focus:ring-neon-green/40 ${!isEditable ? 'opacity-70 cursor-not-allowed' : ''}`}
                            disabled={!isEditable}
                            required
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="modal-eventCategory" className="block text-sm font-medium text-gray-300 mb-1">
                            Event Category
                          </label>
                          <select
                            id="modal-eventCategory"
                            name="eventCategory"
                            value={editableSponsorship.eventCategory}
                            onChange={handleEditableSponsorshipChange}
                            className={`w-full px-4 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none focus:ring-1 focus:ring-neon-green/40 ${!isEditable ? 'opacity-70 cursor-not-allowed' : ''}`}
                            disabled={!isEditable}
                            required
                          >
                            <option value="Tech Fest" className="bg-black">Tech Fest</option>
                            <option value="Cultural Fest" className="bg-black">Cultural Fest</option>
                            <option value="Sports Meet" className="bg-black">Sports Meet</option>
                            <option value="Business Summit" className="bg-black">Business Summit</option>
                            <option value="Hackathon" className="bg-black">Hackathon</option>
                            <option value="Workshop Series" className="bg-black">Workshop Series</option>
                            <option value="Conference" className="bg-black">Conference</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="modal-eventDate" className="block text-sm font-medium text-gray-300 mb-1">
                            Event Date
                          </label>
                          <input
                            id="modal-eventDate"
                            name="eventDate"
                            type="date"
                            value={editableSponsorship.eventDate}
                            onChange={handleEditableSponsorshipChange}
                            className={`w-full px-4 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none focus:ring-1 focus:ring-neon-green/40 ${!isEditable ? 'opacity-70 cursor-not-allowed' : ''}`}
                            disabled={!isEditable}
                            required
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="modal-applicationDeadline" className="block text-sm font-medium text-gray-300 mb-1">
                            Application Deadline
                          </label>
                          <input
                            id="modal-applicationDeadline"
                            name="applicationDeadline"
                            type="date"
                            value={editableSponsorship.applicationDeadline}
                            onChange={handleEditableSponsorshipChange}
                            className={`w-full px-4 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none focus:ring-1 focus:ring-neon-green/40 ${!isEditable ? 'opacity-70 cursor-not-allowed' : ''}`}
                            disabled={!isEditable}
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="modal-requirements" className="block text-sm font-medium text-gray-300 mb-1">
                          Requirements
                        </label>
                        <textarea
                          id="modal-requirements"
                          name="requirements"
                          value={editableSponsorship.requirements}
                          onChange={handleEditableSponsorshipChange}
                          rows={3}
                          className={`w-full px-4 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none focus:ring-1 focus:ring-neon-green/40 ${!isEditable ? 'opacity-70 cursor-not-allowed' : ''}`}
                          disabled={!isEditable}
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="modal-targetCriteria" className="block text-sm font-medium text-gray-300 mb-1">
                          Target Audience Criteria
                        </label>
                        <textarea
                                          id="modal-targetCriteria"
                                          name="targetCriteria"
                                          value={editableSponsorship.targetCriteria}
                                          onChange={handleEditableSponsorshipChange}
                                          rows={3}
                                          className={`w-full px-4 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none focus:ring-1 focus:ring-neon-green/40 ${!isEditable ? 'opacity-70 cursor-not-allowed' : ''}`}
                                          disabled={!isEditable}
                                          required
                                        />
                                      </div>
                                      
                                      <div>
                                        <label htmlFor="modal-expectedFootfall" className="block text-sm font-medium text-gray-300 mb-1">
                                          Expected Footfall
                                        </label>
                                        <input
                                          id="modal-expectedFootfall"
                                          name="expectedFootfall"
                                          type="number"
                                          value={editableSponsorship.expectedFootfall}
                                          onChange={handleEditableSponsorshipChange}
                                          className={`w-full px-4 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none focus:ring-1 focus:ring-neon-green/40 ${!isEditable ? 'opacity-70 cursor-not-allowed' : ''}`}
                                          disabled={!isEditable}
                                          required
                                        />
                                      </div>
                                      
                                      <div className="flex justify-end space-x-4 mt-6">
                                        <button
                                          type="button"
                                          onClick={() => setShowModal(false)}
                                          className="px-6 py-2 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-all"
                                        >
                                          Close
                                        </button>
                                        {isEditable && (
                                          <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-6 py-2 bg-neon-green text-black rounded-lg font-semibold hover:bg-[#00CC00] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                          >
                                            {loading ? 'Updating...' : 'Update & Submit'}
                                          </button>
                                        )}
                                      </div>
                                    </form>
                                  </div>
                                </div>
                              );
                            };
                          
                            const renderUniversityRequestModal = () => {
                              if (!selectedUniversityRequest || !selectedUniversityProfile) return null;
                              
                              return (
                                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80">
                                  <div 
                                    className="bg-black border border-neon-green/30 rounded-xl p-6 max-w-2xl w-full max-h-[78vh] overflow-y-auto"
                                    style={{
                                      ...styles.hideScrollbar,
                                      overscrollBehavior: 'contain'
                                    }}
                                  >
                                    <div className="flex justify-between items-center mb-4">
                                      <h2 className="text-2xl font-bold text-white">University Sponsorship Request</h2>
                                      <button 
                                        onClick={() => setShowUniversityModal(false)}
                                        className="text-gray-400 hover:text-white"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <line x1="18" y1="6" x2="6" y2="18"></line>
                                          <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                      </button>
                                    </div>
                                    
                                    <div className="mb-8 flex items-center gap-4">
                                      {selectedUniversityProfile.logo ? (
                                        <img src={selectedUniversityProfile.logo} alt={selectedUniversityProfile.university_name} className="h-20 w-20 object-contain bg-white/5 rounded-lg p-2" />
                                      ) : (
                                        <div className="h-20 w-20 bg-white/5 rounded-lg flex items-center justify-center">
                                          <School className="h-10 w-10 text-gray-400" />
                                        </div>
                                      )}
                                      <div>
                                        <h3 className="text-xl font-semibold text-white">{selectedUniversityProfile.university_name}</h3>
                                        <p className="text-gray-400">{selectedUniversityProfile.location}</p>
                                      </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                      <div>
                                        <h4 className="text-lg font-semibold text-white mb-2">University Details</h4>
                                        <div className="space-y-2 text-gray-300">
                                          <p><span className="text-gray-400">Type:</span> {selectedUniversityProfile.type}</p>
                                          <p><span className="text-gray-400">Website:</span> <a href={selectedUniversityProfile.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">{selectedUniversityProfile.website}</a></p>
                                          <p><span className="text-gray-400">Email:</span> {selectedUniversityProfile.contact_email}</p>
                                          <p><span className="text-gray-400">Phone:</span> {selectedUniversityProfile.contact_phone}</p>
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <h4 className="text-lg font-semibold text-white mb-2">Sponsorship Request</h4>
                                        <div className="space-y-2 text-gray-300">
                                          <p><span className="text-gray-400">Amount:</span> <span className="text-neon-green font-semibold">₹{parseFloat(selectedUniversityRequest.amount).toLocaleString()}</span></p>
                                          <p><span className="text-gray-400">Event Date:</span> {new Date(selectedUniversityRequest.event_date).toLocaleDateString()}</p>
                                          <p><span className="text-gray-400">Category:</span> {selectedUniversityRequest.event_category}</p>
                                          <p><span className="text-gray-400">Request Date:</span> {new Date(selectedUniversityRequest.created_at).toLocaleDateString()}</p>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="mb-6">
                                      <h4 className="text-lg font-semibold text-white mb-2">Event Description</h4>
                                      <p className="text-gray-300 bg-white/5 p-4 rounded-lg">{selectedUniversityRequest.description}</p>
                                    </div>
                                    
                                    {selectedUniversityProfile.description && (
                                      <div className="mb-8">
                                        <h4 className="text-lg font-semibold text-white mb-2">About University</h4>
                                        <p className="text-gray-300 bg-white/5 p-4 rounded-lg">{selectedUniversityProfile.description}</p>
                                      </div>
                                    )}
                                    
                                    <div className="flex justify-end space-x-4 mt-6">
                                      <button
                                        type="button"
                                        onClick={() => setShowUniversityModal(false)}
                                        className="px-6 py-2 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-all"
                                      >
                                        Close
                                      </button>
                                      <button
                                        onClick={handleRequestChanges}
                                        disabled={loading}
                                        className="px-6 py-2 bg-yellow-500 text-black rounded-lg font-semibold hover:bg-yellow-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                      >
                                        <MessageSquare size={18} />
                                        Request Changes
                                      </button>
                                      <button
                                        onClick={handleRejectRequest}
                                        disabled={loading}
                                        className="px-6 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                      >
                                        <ThumbsDown size={18} />
                                        Reject
                                      </button>
                                      <button
                                        onClick={handleAcceptRequest}
                                        disabled={loading}
                                        className="px-6 py-2 bg-neon-green text-black rounded-lg font-semibold hover:bg-[#00CC00] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                      >
                                        <ThumbsUp size={18} />
                                        Accept
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            };
                          
                            const renderFeedbackModal = () => {
                              if (!showFeedbackModal) return null;
                              
                              return (
                                <div className="fixed inset-0 flex items-center justify-center z-[60] bg-black/80">
                                  <div className="bg-black border border-neon-green/30 rounded-xl p-6 max-w-md w-full">
                                    <div className="flex justify-between items-center mb-4">
                                      <h2 className="text-xl font-bold text-white">Request Changes</h2>
                                      <button 
                                        onClick={() => setShowFeedbackModal(false)}
                                        className="text-gray-400 hover:text-white"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <line x1="18" y1="6" x2="6" y2="18"></line>
                                          <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                      </button>
                                    </div>
                                    
                                    <p className="text-gray-300 mb-4">Please provide feedback on what changes are needed:</p>
                                    
                                    <textarea
                                      value={feedbackMessage}
                                      onChange={(e) => setFeedbackMessage(e.target.value)}
                                      rows={5}
                                      className="w-full px-4 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none focus:ring-1 focus:ring-neon-green/40 mb-4"
                                      placeholder="Enter your feedback here..."
                                      required
                                    />
                                    
                                    <div className="flex justify-end space-x-4">
                                      <button
                                        type="button"
                                        onClick={() => setShowFeedbackModal(false)}
                                        className="px-6 py-2 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-all"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={handleSubmitFeedback}
                                        disabled={loading || !feedbackMessage.trim()}
                                        className="px-6 py-2 bg-neon-green text-black rounded-lg font-semibold hover:bg-[#00CC00] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        {loading ? 'Submitting...' : 'Submit Feedback'}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            };
                          
                            const renderSuccessMessage = () => (
                              <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute top-4 right-4 bg-green-500/90 backdrop-blur-sm text-white p-4 rounded-lg shadow-lg flex items-center gap-3 z-10"
                              >
                                <CheckCircle className="text-white" />
                                <span>
                                  {activeSlide === 'profile'
                                    ? 'Profile updated successfully!'
                                    : 'Sponsorship submitted successfully! Redirecting...'}
                                </span>
                              </motion.div>
                            );
                          
                            // Progress indicator removed
                          
                            return (
                              <div className="min-h-screen pt-16 bg-black">
                                <div className="absolute inset-0">
                                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#00FF0015_1px,transparent_1px)] bg-[size:100px] bg-[position:center] animated-grid after:content-[''] after:absolute after:inset-0 after:bg-[linear-gradient(to_bottom,#00FF0015_1px,transparent_1px)] after:bg-[size:100px] after:bg-[position:center]">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-black"></div>
                                  </div>
                                </div>
                          
                                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20 relative z-10">
                                  
                                  <div className="flex items-center justify-between mb-8">
                                    <div>
                                      <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                                        Submit Sponsorship
                                      </h1>
                                      <p className="text-gray-400">
                                        Complete your brand profile and create sponsorship opportunities
                                      </p>
                                    </div>
                                    <button
                                      onClick={handleRefresh}
                                      className={`p-2 rounded-lg border border-neon-green/20 text-white hover:bg-neon-green/5 transition-all ${
                                        isRefreshing ? 'animate-spin' : ''
                                      }`}
                                      disabled={isRefreshing}
                                    >
                                      <RefreshCw className="w-5 h-5" />
                                    </button>
                                  </div>
                                  
                                  {success && renderSuccessMessage()}
          
                                  <div className="bg-black/40 backdrop-blur-lg border border-neon-green/20 rounded-xl p-6 md:p-8 shadow-xl overflow-hidden">
                                    <div className="mb-6 border-b border-neon-green/20 pb-4 overflow-x-auto" style={styles.hideScrollbar}>
                                      <div className="flex space-x-4 md:space-x-8 min-w-max">
                                        <button
                                          onClick={() => setActiveSlide('profile')}
                                          className={`pb-2 px-2 font-medium text-lg transition-all ${
                                            activeSlide === 'profile'
                                              ? 'text-neon-green border-b-2 border-neon-green'
                                              : 'text-gray-400 hover:text-gray-300'
                                          }`}
                                        >
                                          Brand Profile
                                          {profileComplete && (
                                            <CheckCircle className="inline-block ml-2 w-4 h-4 text-neon-green" />
                                          )}
                                        </button>
                                        <button
                                          onClick={() => profileComplete && setActiveSlide('sponsorship')}
                                          disabled={!profileComplete}
                                          className={`pb-2 px-2 font-medium text-lg transition-all ${
                                            activeSlide === 'sponsorship'
                                              ? 'text-neon-green border-b-2 border-neon-green'
                                              : 'text-gray-400 hover:text-gray-300'
                                          } ${!profileComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                          Sponsorship Details
                                        </button>
                                        <button
                                          onClick={() => profileComplete && setActiveSlide('packages')}
                                          disabled={!profileComplete}
                                          className={`pb-2 px-2 font-medium text-lg transition-all ${
                                            activeSlide === 'packages'
                                              ? 'text-neon-green border-b-2 border-neon-green'
                                              : 'text-gray-400 hover:text-gray-300'
                                          } ${!profileComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                          Sponsorship Status
                                        </button>
                                        <button
                                          onClick={() => {
                                            if (profileComplete) {
                                              setActiveSlide('requests');
                                              loadUniversityRequests(); // Call this to refresh data when tab is clicked
                                              console.log('University Requests tab clicked, refreshing data...');
                                            }
                                          }}
                                          disabled={!profileComplete}
                                          className={`pb-2 px-2 font-medium text-lg transition-all ${
                                            activeSlide === 'requests'
                                              ? 'text-neon-green border-b-2 border-neon-green'
                                              : 'text-gray-400 hover:text-gray-300'
                                          } ${!profileComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                          University Requests
                                        </button>
                                      </div>
                                    </div>
                          
                                    {!profileComplete && activeSlide === 'profile' && (
                                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
                                        <p className="text-yellow-200 flex items-center">
                                          <Info className="mr-2 h-5 w-5" />
                                          Please complete your brand profile before submitting sponsorships
                                        </p>
                                      </div>
                                    )}
                          
                                    {activeSlide === 'profile'
                                      ? renderProfileForm()
                                      : activeSlide === 'sponsorship'
                                        ? renderSponsorshipForm()
                                        : activeSlide === 'packages'
                                          ? renderPackagesCards()
                                          : renderUniversityRequests()}
                                  </div>
                                  
                                  {showModal && renderSponsorshipModal()}
                                  {showUniversityModal && renderUniversityRequestModal()}
                                  {showFeedbackModal && renderFeedbackModal()}
                                </div>
                              </div>
                            );
                          };
                          
                          export default SubmitSponsorship;