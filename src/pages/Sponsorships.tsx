import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Search,
  X,
  Plus,
  Clock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Filter,
  IndianRupee,
  Users,
  CheckCircle,
  XCircle,
  FileText,
  ListChecks,
  UserCircle,
  Upload,
  Briefcase,
  MapPin,
  Globe,
  Mail,
  Phone,
  AlertCircle,
  Save,
  Building,
  Facebook,
  Twitter,
  Instagram,
  Linkedin
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface BrandProfile {
  logo: string;
}

interface SponsorshipListing {
  id: string;
  title: string;
  description: string;
  amount: number;
  requirements: string;
  target_criteria: string;
  event_date: string;
  event_category: string;
  expected_footfall: number;
  application_deadline: string;
  status: string;
  reviewer_id: string | null;
  review_date: string | null;
  feedback: string | null;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  isAccepted?: boolean;
  brandLogo?: string; // Add this field to store the brand logo
}

interface UniversityProfile {
  id?: string;
  username: string;
  university_name: string;
  website?: string | null;
  location?: string | null;
  type?: string | null;
  description?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  social_media?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  } | null;
  address?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  is_complete?: boolean | null;
  logo?: string | null; // Changed from 'crest' to 'logo'
}

interface FilterState {
  amount: [number, number];
  category: string;
  deadline: string;
}

interface SponsorshipAcceptance {
  accepted_by: string,
  acceptance_status: string,
  accepted_on: string
}

type TabType = 'submit' | 'opportunities' | 'status' | 'profile';

const Sponsorships = () => {
  const navigate = useNavigate();
  const userType = localStorage.getItem('userType');
  const username = localStorage.getItem('username');
  const userId = localStorage.getItem('username');
  const userid = localStorage.getItem('userid');
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const [sponsorships, setSponsorships] = useState<SponsorshipListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'event_date', direction: 'asc' });
  const [acceptedSponsorships, setAcceptedSponsorships] = useState<string[]>([]);
  
  // Profile state
  const [profile, setProfile] = useState<UniversityProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Active tab state
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  
  // Modal state
  const [selectedSponsorship, setSelectedSponsorship] = useState<SponsorshipListing | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [acceptSuccess, setAcceptSuccess] = useState(false);
  const [acceptError, setAcceptError] = useState('');
  const [alreadyAccepted, setAlreadyAccepted] = useState(false);
  
  const [filters, setFilters] = useState<FilterState>({
    amount: [100, 500000],
    category: 'all',
    deadline: 'all'
  });

  const categories = [
    'Tech Fest',
    'Cultural Fest',
    'Sports Meet',
    'Business Summit',
    'Hackathon',
    'Workshop Series',
    'Conference'
  ];

  const universityTypes = [
    'Central University',
    'State University',
    'Private University',
    'Deemed University',
    'Institute of National Importance',
    'Autonomous College',
    'Affiliated College',
    'Other'
  ];

  useEffect(() => {
    console.log("Component mounted with auth status:", { isAuthenticated, username });
    
    if (!isAuthenticated || !username) {
      console.log("Redirecting to signin due to missing auth");
      navigate('/signin');
      return;
    }

    // Fetch university profile if user is a university
    if (userType === 'university') {
      fetchUniversityProfile();
    }

    loadSponsorships();
  }, [isAuthenticated, username, navigate, userType]);

  const fetchUniversityProfile = async () => {
    if (!username) return;
  
    try {
      setProfileLoading(true);
      const { data, error } = await supabase
        .from('university_profiles')
        .select('*')
        .eq('username', username)
        .single();
  
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching university profile:', error);
        return;
      }
  
      if (data) {
        setProfile(data);
        setProfileComplete(data.is_complete || false);
        if (data.logo) { // Check for 'logo' instead of 'crest'
          setPreviewImage(data.logo);
        }
      } else {
        // Initialize a new profile with the username
        setProfile({
          username: username,
          university_name: '',
          social_media: {
            facebook: '',
            twitter: '',
            instagram: '',
            linkedin: ''
          }
        });
      }
    } catch (error) {
      console.error('Error fetching university profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('social_media.')) {
      const socialKey = name.split('.')[1];
      setProfile(prev => {
        if (!prev) return null;
        return {
          ...prev,
          social_media: {
            ...prev.social_media,
            [socialKey]: value
          }
        };
      });
    } else {
      setProfile(prev => {
        if (!prev) return null;
        return { ...prev, [name]: value };
      });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setProfileError('Image size should be less than 5MB');
      return;
    }
  
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPreviewImage(base64String);
      setProfile(prev => {
        if (!prev) return null;
        return { ...prev, logo: base64String }; // Store in 'logo' field instead of 'crest'
      });
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    if (!profile || !username) return;
  
    // Validate required fields
    if (!profile.university_name.trim()) {
      setProfileError('University name is required');
      return;
    }
  
    try {
      setProfileSaving(true);
      setProfileError('');
      setProfileSuccess(false);
  
      console.log("Profile data before sending:", profile);
  
      // Create a clean profile object with correct field names
      const cleanProfileData = {
        username: profile.username,
        university_name: profile.university_name,
        website: profile.website || null,
        location: profile.location || null,
        type: profile.type || null,
        description: profile.description || null,
        contact_email: profile.contact_email || null,
        contact_phone: profile.contact_phone || null,
        social_media: profile.social_media || null,
        address: profile.address || null,
        logo: previewImage, // Use the previewImage state which contains the base64 string
        is_complete: true,
        updated_at: new Date().toISOString()
      };
  
      console.log("Data being sent to Supabase:", cleanProfileData);
  
      // First, check if the university profile already exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('university_profiles')
        .select('id')
        .eq('username', username)
        .single();
  
      let result;
  
      if (existingProfile?.id) {
        // Update existing profile
        result = await supabase
          .from('university_profiles')
          .update(cleanProfileData)
          .eq('id', existingProfile.id);
      } else {
        // Insert new profile
        result = await supabase
          .from('university_profiles')
          .insert([cleanProfileData]);
      }
  
      console.log("Supabase operation result:", result);
  
      if (result.error) {
        throw result.error;
      }
  
      setProfileComplete(true);
      setProfileSuccess(true);
      console.log('Profile saved successfully');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      setProfileError(`Failed to save profile: ${error.message}`);
    } finally {
      setProfileSaving(false);
    }
  };

  // Load accepted sponsorships for the current user
  const loadAcceptedSponsorships = async () => {
    if (!userid) return [];
    
    try {
      console.log("user_id", userid);
      const { data, error } = await supabase
        .from('sponsorship_requests')
        .select('*')
        .eq('accepted_by', userid);
        
      if (error) {
        console.error('Error loading accepted sponsorships:', error);
        return [];
      }
      console.log("Accepted sponsorships data:", data);
      return data || [];
    } catch (error) {
      console.error('Error loading accepted sponsorships:', error);
      return [];
    }
  };

  const fetchBrandLogo = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('brand_profiles')
        .select('logo')
        .eq('id', userId)
        .order('created_at', { ascending: false })
        .single();
        
      if (error) {
        console.error('Error fetching brand logo:', error);
        return null;
      }
      
      return data?.logo || null;
    } catch (error) {
      console.error('Error fetching brand logo:', error);
      return null;
    }
  };

  const loadSponsorships = async () => {
    try {
      console.log("Loading sponsorships...");
      setLoading(true);
      
      // First load the accepted sponsorships
      const acceptedSponsorshipsData = await loadAcceptedSponsorships();
      const acceptedIds = acceptedSponsorshipsData.map(s => s.id);
      console.log("User has accepted sponsorship IDs:", acceptedIds);
      
      // Try to fetch approved sponsorships with retry logic
      let approvedData = null;
      let approvedError = null;
      let retries = 3;

      while (retries > 0 && !approvedData) {
        try {
          const response = await supabase
            .from('sponsorship_requests')
            .select('*')
            .eq('status', 'approved')
            .order('created_at', { ascending: false });
            
          if (response.error) {
            approvedError = response.error;
            retries--;
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
          } else {
            approvedData = response.data;
            break;
          }
        } catch (e) {
          approvedError = e;
          retries--;
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
        }
      }

      if (!approvedData) {
        console.error('Supabase error after retries:', approvedError);
        throw approvedError || new Error('Failed to load approved sponsorships');
      }
      
      // Try to fetch accepted sponsorships with retry logic
      let acceptedData = null;
      let acceptedError = null;
      retries = 3;

      while (retries > 0 && !acceptedData) {
        try {
          const response = await supabase
            .from('sponsorship_requests')
            .select('*')
            .eq('acceptance_status', 'accepted')
            .order('created_at', { ascending: false });
            
          if (response.error) {
            acceptedError = response.error;
            retries--;
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
          } else {
            acceptedData = response.data;
            break;
          }
        } catch (e) {
          acceptedError = e;
          retries--;
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
        }
      }

      if (!acceptedData) {
        console.error('Supabase error after retries:', acceptedError);
        throw acceptedError || new Error('Failed to load accepted sponsorships');
      }
  
      // Filter out sponsorships that are already accepted by others
      const difference = approvedData.filter(approvedItem => 
        !acceptedData.some(acceptedItem => acceptedItem.id === approvedItem.id)
      );
      
      console.log('Records that are approved but not accepted by anyone:', difference);
  
      // Combine user's accepted sponsorships with available sponsorships
      const allSponsorshipsToDisplay = [...acceptedSponsorshipsData, ...difference];
      
      // Fetch brand logos for all sponsorships
      const sponsorshipsWithLogos = await Promise.all(
        allSponsorshipsToDisplay.map(async (sponsorship) => {
          const brandLogo = sponsorship.user_id ? await fetchBrandLogo(sponsorship.user_id) : null;
          return {
            ...sponsorship,
            isAccepted: acceptedIds.includes(sponsorship.id),
            brandLogo
          };
        })
      );
      
      console.log("Total sponsorships to display:", sponsorshipsWithLogos.length);
      console.log(`- Accepted by user: ${acceptedSponsorshipsData.length}`);
      console.log(`- Available for acceptance: ${difference.length}`);
      
      setSponsorships(sponsorshipsWithLogos);
      setAcceptedSponsorships(acceptedIds);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error loading sponsorships:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: string) => {
    console.log("Sorting by:", key);
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const getTimeLeft = (deadline: string) => {
    const days = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    if (days < 0) return 'Expired';
    if (days === 0) return 'Last day';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  };

  const openSponsorshipDetails = async (sponsorship: SponsorshipListing) => {
    setSelectedSponsorship(sponsorship);
    setShowModal(true);
    setAcceptSuccess(false);
    setAcceptError('');
    
    // Check if the university has already accepted this sponsorship
    setAlreadyAccepted(sponsorship.isAccepted || false);
  };

  const handleAcceptSponsorship = async () => {
    if (!selectedSponsorship || !userid) {
      setAcceptError("Unable to accept. Missing required information.");
      return;
    }
    
    // Check if profile is complete for universities
    if (userType === 'university' && !profileComplete) {
      setAcceptError("Please complete your profile before accepting sponsorships.");
      setActiveTab('profile');
      setShowModal(false);
      return;
    }
    
    try {
      setAcceptLoading(true);
      setAcceptError('');
      
      // Check one more time if already accepted to prevent duplicate entries
      const { data: existingAcceptance, error: checkError } = await supabase
        .from('sponsorship_requests')
        .select('*')
        .eq('accepted_by', userid)
        .eq('id', selectedSponsorship.id)
        .single();
        
      if (existingAcceptance) {
        setAlreadyAccepted(true);
        setAcceptError('You have already accepted this sponsorship.');
        return;
      }
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking acceptance status:', checkError);
        setAcceptError('An error occurred while checking your acceptance status.');
        return;
      }
      
      // Create the acceptance record
      const sponsorshipAcceptance: SponsorshipAcceptance = { 
        accepted_by: userid.toString(),
        acceptance_status: 'accepted',
        accepted_on: new Date().toISOString()
      };
      
      const { error: updateError } = await supabase
        .from('sponsorship_requests')
        .update(sponsorshipAcceptance)
        .eq('id', selectedSponsorship.id);
      
      if (updateError) {
        console.error('Error accepting sponsorship:', updateError);
        setAcceptError('Failed to accept sponsorship: ' + updateError.message);
        return;
      }
      
      setAcceptSuccess(true);
      setAlreadyAccepted(true);
      
      // Update the list of accepted sponsorships
      setAcceptedSponsorships(prev => [...prev, selectedSponsorship.id]);
      
      // Update the sponsorships list to reflect the new acceptance status
      setSponsorships(prev => 
        prev.map(s => 
          s.id === selectedSponsorship.id 
            ? { ...s, isAccepted: true } 
            : s
        )
      );
      
      console.log('Sponsorship accepted successfully');
      
    } catch (error: any) {
      console.error('Error accepting sponsorship:', error);
      setAcceptError('An unexpected error occurred: ' + error.message);
    } finally {
      setAcceptLoading(false);
    }
  };

  // Apply filtering based on search term and filters
  const filteredSponsorships = sponsorships
    .filter(sponsorship => {
      // Search term filter
      if (searchTerm && !sponsorship.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !sponsorship.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Amount filter - only filter if the sponsorship has an amount value
      if (typeof sponsorship.amount === 'number' &&
          (sponsorship.amount < filters.amount[0] || sponsorship.amount > filters.amount[1])) {
        return false;
      }
      
      // Category filter - only filter if category is specified
      if (filters.category !== 'all' && sponsorship.event_category !== filters.category) {
        return false;
      }
      
      // Deadline filter
      if (filters.deadline !== 'all' && sponsorship.application_deadline) {
        const deadline = new Date(sponsorship.application_deadline);
        const today = new Date();
        const diffTime = deadline.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (filters.deadline === 'week' && diffDays > 7) {
          return false;
        } else if (filters.deadline === 'month' && diffDays > 30) {
          return false;
        } else if (filters.deadline === 'quarter' && diffDays > 90) {
          return false;
        }
      }
      
      return true;
    })
    .sort((a, b) => {
      const direction = sortConfig.direction === 'asc' ? 1 : -1;
      
      switch (sortConfig.key) {
        case 'amount':
          return (a.amount - b.amount) * direction;
        case 'event_date':
          return (new Date(a.event_date).getTime() - new Date(b.event_date).getTime()) * direction;
        case 'deadline':
          return (new Date(a.application_deadline).getTime() - new Date(b.application_deadline).getTime()) * direction;
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen pt-16 bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Profile completeness warning for universities
  const showProfileWarning = userType === 'university' && !profileComplete && activeTab !== 'profile';

  return (
    <div className="min-h-screen pt-16 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Sponsorships</h1>
          <p className="text-xl text-gray-300">
            {userType === 'university' 
              ? 'Find and apply for sponsorships from leading brands'
              : 'Manage your sponsorship listings and applications'}
          </p>
        </div>
        
        {/* Profile Completeness Warning */}
        {showProfileWarning && (
          <div className="bg-amber-900/30 border border-amber-500/30 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="text-amber-400 w-6 h-6 flex-shrink-0" />
            <div>
              <p className="text-amber-400 font-medium">Your profile is incomplete</p>
              <p className="text-amber-300/80 text-sm mt-1">
                Complete your university profile to access sponsorship opportunities.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('profile')}
              className="ml-auto px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded-lg transition-colors"
            >
              Complete Profile
            </button>
          </div>
        )}
        
        {/* Tab Navigation */}
        <div className="flex flex-wrap border-b border-neon-green/30 mb-8 overflow-x-auto pb-1">
          <button
            className={`px-6 py-3 font-medium text-lg rounded-t-lg flex items-center gap-2 whitespace-nowrap
              ${activeTab === 'profile' ?
                'bg-neon-green/10 text-neon-green border-b-2 border-neon-green' :
                'text-gray-400 hover:text-white hover:bg-white/5'}`}
            onClick={() => setActiveTab('profile')}
          >
            <UserCircle className="w-5 h-5" />
            Profile
          </button>
          <button
            className={`px-6 py-3 font-medium text-lg rounded-t-lg flex items-center gap-2 whitespace-nowrap
              ${activeTab === 'submit' ?
                'bg-neon-green/10 text-neon-green border-b-2 border-neon-green' :
                'text-gray-400 hover:text-white hover:bg-white/5'}`}
            onClick={() => !profileComplete && userType === 'university' ? null : setActiveTab('submit')}
            disabled={!profileComplete && userType === 'university'}
            style={!profileComplete && userType === 'university' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            <FileText className="w-5 h-5" />
            Submit a Sponsorship Request
          </button>
          <button
            className={`px-6 py-3 font-medium text-lg rounded-t-lg flex items-center gap-2 whitespace-nowrap
              ${activeTab === 'opportunities' ?
                'bg-neon-green/10 text-neon-green border-b-2 border-neon-green' :
                'text-gray-400 hover:text-white hover:bg-white/5'}`}
            onClick={() => !profileComplete && userType === 'university' ? null : setActiveTab('opportunities')}
            disabled={!profileComplete && userType === 'university'}
            style={!profileComplete && userType === 'university' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            <IndianRupee className="w-5 h-5" />
            Sponsorship Opportunities
          </button>
          <button
            className={`px-6 py-3 font-medium text-lg rounded-t-lg flex items-center gap-2 whitespace-nowrap
              ${activeTab === 'status' ?
                'bg-neon-green/10 text-neon-green border-b-2 border-neon-green' :
                'text-gray-400 hover:text-white hover:bg-white/5'}`}
            onClick={() => !profileComplete && userType === 'university' ? null : setActiveTab('status')}
            disabled={!profileComplete && userType === 'university'}
            style={!profileComplete && userType === 'university' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            <ListChecks className="w-5 h-5" />
            Request Status
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white/5 backdrop-blur-lg rounded-lg p-8 border border-neon-green/20">
            {profileLoading ? (
              <div className="flex justify-center items-center h-48">
                <div className="text-white">Loading profile...</div>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">University Profile</h2>
                  <p className="text-gray-300">
                    Complete your university profile to access sponsorship opportunities.
                  </p>
                </div>

                {profileError && (
                  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6 flex items-center gap-3">
                    <XCircle className="text-red-500 w-5 h-5 flex-shrink-0" />
                    <p className="text-red-400">{profileError}</p>
                  </div>
                )}

                {profileSuccess && (
                  <div className="bg-neon-green/10 border border-neon-green/30 rounded-lg p-4 mb-6 flex items-center gap-3">
                    <CheckCircle className="text-neon-green w-5 h-5 flex-shrink-0" />
                    <p className="text-neon-green">Profile saved successfully!</p>
                  </div>
                )}

                <form className="space-y-8">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Building className="w-5 h-5" /> Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Username
                        </label>
                        <input
                          type="text"
                          name="username"
                          value={profile?.username || ''}
                          disabled
                          className="w-full px-4 py-2 bg-white/10 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-400 mt-1">Username cannot be changed</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1 required">
                          University Name*
                        </label>
                        <input
                          type="text"
                          name="university_name"
                          value={profile?.university_name || ''}
                          onChange={handleProfileChange}
                          required
                          className="w-full px-4 py-2 bg-white/10 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Website
                        </label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 py-2 rounded-l-lg border border-r-0 border-neon-green/20 bg-white/5 text-gray-400">
                            <Globe className="w-4 h-4" />
                          </span>
                          <input
                            type="url"
                            name="website"
                            placeholder="https://www.university.edu"
                            value={profile?.website || ''}
                            onChange={handleProfileChange}
                            className="w-full px-4 py-2 bg-white/10 border border-neon-green/20 rounded-r-lg text-white focus:border-neon-green/40 focus:outline-none"
                        />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          University Type
                        </label>
                        <select
                          name="type"
                          value={profile?.type || ''}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-2 bg-white/10 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none"
                        >
                          <option value="" className="bg-black">Select Type</option>
                          {universityTypes.map(type => (
                            <option key={type} value={type} className="bg-black">
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* University Logo Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Upload className="w-5 h-5" /> University Logo
                    </h3>
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                      <div className="flex-shrink-0">
                        {previewImage ? (
                          <div className="relative">
                            <img 
                              src={previewImage} 
                              alt="University logo" 
                              className="w-32 h-32 object-contain bg-white/5 border border-neon-green/20 rounded-lg p-2"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewImage(null);
                                setProfile(prev => prev ? {...prev, logo: null} : null); // Update reference from 'crest' to 'logo'
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-32 h-32 bg-white/5 border border-neon-green/20 rounded-lg flex items-center justify-center">
                            <Upload className="w-10 h-10 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-grow">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white hover:bg-white/10 transition-all flex items-center gap-2"
                        >
                          <Upload className="w-4 h-4" />
                          {previewImage ? 'Change Logo' : 'Upload Logo'}
                        </button>
                        <p className="text-gray-400 text-sm mt-2">
                          Upload your university logo. Max size: 5MB. Recommended format: PNG or JPEG with transparent background.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Phone className="w-5 h-5" /> Contact Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Email Address
                        </label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 py-2 rounded-l-lg border border-r-0 border-neon-green/20 bg-white/5 text-gray-400">
                            <Mail className="w-4 h-4" />
                          </span>
                          <input
                            type="email"
                            name="contact_email"
                            placeholder="contact@university.edu"
                            value={profile?.contact_email || ''}
                            onChange={handleProfileChange}
                            className="w-full px-4 py-2 bg-white/10 border border-neon-green/20 rounded-r-lg text-white focus:border-neon-green/40 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Phone Number
                        </label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 py-2 rounded-l-lg border border-r-0 border-neon-green/20 bg-white/5 text-gray-400">
                            <Phone className="w-4 h-4" />
                          </span>
                          <input
                            type="tel"
                            name="contact_phone"
                            placeholder="+91 XXXXX XXXXX"
                            value={profile?.contact_phone || ''}
                            onChange={handleProfileChange}
                            className="w-full px-4 py-2 bg-white/10 border border-neon-green/20 rounded-r-lg text-white focus:border-neon-green/40 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Address
                        </label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 py-2 rounded-l-lg border border-r-0 border-neon-green/20 bg-white/5 text-gray-400">
                            <MapPin className="w-4 h-4" />
                          </span>
                          <textarea
                            name="address"
                            placeholder="Full address of the university"
                            value={profile?.address || ''}
                            onChange={handleProfileChange}
                            rows={3}
                            className="w-full px-4 py-2 bg-white/10 border border-neon-green/20 rounded-r-lg text-white focus:border-neon-green/40 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Location
                        </label>
                        <input
                          type="text"
                          name="location"
                          placeholder="City, State"
                          value={profile?.location || ''}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-2 bg-white/10 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* About */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5" /> About University
                    </h3>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      placeholder="Tell us about your university, its achievements, and what makes it unique..."
                      value={profile?.description || ''}
                      onChange={handleProfileChange}
                      rows={5}
                      className="w-full px-4 py-2 bg-white/10 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none"
                    />
                  </div>

                  {/* Social Media */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Globe className="w-5 h-5" /> Social Media
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Facebook
                        </label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 py-2 rounded-l-lg border border-r-0 border-neon-green/20 bg-white/5 text-gray-400">
                            <Facebook className="w-4 h-4" />
                          </span>
                          <input
                            type="text"
                            name="social_media.facebook"
                            placeholder="https://facebook.com/university"
                            value={profile?.social_media?.facebook || ''}
                            onChange={handleProfileChange}
                            className="w-full px-4 py-2 bg-white/10 border border-neon-green/20 rounded-r-lg text-white focus:border-neon-green/40 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Twitter
                        </label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 py-2 rounded-l-lg border border-r-0 border-neon-green/20 bg-white/5 text-gray-400">
                            <Twitter className="w-4 h-4" />
                          </span>
                          <input
                            type="text"
                            name="social_media.twitter"
                            placeholder="https://twitter.com/university"
                            value={profile?.social_media?.twitter || ''}
                            onChange={handleProfileChange}
                            className="w-full px-4 py-2 bg-white/10 border border-neon-green/20 rounded-r-lg text-white focus:border-neon-green/40 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Instagram
                        </label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 py-2 rounded-l-lg border border-r-0 border-neon-green/20 bg-white/5 text-gray-400">
                            <Instagram className="w-4 h-4" />
                          </span>
                          <input
                            type="text"
                            name="social_media.instagram"
                            placeholder="https://instagram.com/university"
                            value={profile?.social_media?.instagram || ''}
                            onChange={handleProfileChange}
                            className="w-full px-4 py-2 bg-white/10 border border-neon-green/20 rounded-r-lg text-white focus:border-neon-green/40 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          LinkedIn
                        </label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 py-2 rounded-l-lg border border-r-0 border-neon-green/20 bg-white/5 text-gray-400">
                            <Linkedin className="w-4 h-4" />
                          </span>
                          <input
                            type="text"
                            name="social_media.linkedin"
                            placeholder="https://linkedin.com/school/university"
                            value={profile?.social_media?.linkedin || ''}
                            onChange={handleProfileChange}
                            className="w-full px-4 py-2 bg-white/10 border border-neon-green/20 rounded-r-lg text-white focus:border-neon-green/40 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end pt-4 border-t border-neon-green/20">
                    <button
                      type="button"
                      onClick={saveProfile}
                      disabled={profileSaving}
                      className={`flex items-center justify-center gap-2 px-8 py-3 bg-neon-green text-black rounded-lg font-semibold hover:bg-[#00CC00] transition-all ${
                        profileSaving ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                    >
                      {profileSaving ? 'Saving...' : 'Save Profile'}
                      {!profileSaving && <Save className="w-5 h-5" />}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        )}

        {/* Submit a Sponsorship Request Tab */}
        {activeTab === 'submit' && (
          <div className="bg-white/5 backdrop-blur-lg rounded-lg p-8 border border-neon-green/20">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Submit a Sponsorship Request</h2>
              <p className="text-gray-300 mb-6">This feature is coming soon. Stay tuned for updates!</p>
            </div>
          </div>
        )}

        {/* Sponsorship Opportunities Tab - Current Functionality */}
        {activeTab === 'opportunities' && (
          <>
            {/* Show profile warning if needed */}
            {userType === 'university' && !profileComplete && (
              <div className="bg-amber-900/30 border border-amber-500/30 rounded-lg p-4 mb-6 flex items-center gap-3">
                <AlertCircle className="text-amber-400 w-6 h-6 flex-shrink-0" />
                <div>
                  <p className="text-amber-400 font-medium">Complete your profile to unlock sponsorships</p>
                  <p className="text-amber-300/80 text-sm mt-1">
                    You need to complete your university profile before you can accept sponsorships.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('profile')}
                  className="ml-auto px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded-lg transition-colors"
                >
                  Complete Now
                </button>
              </div>
            )}

            {/* Search and Filters */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search sponsorships..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white hover:bg-white/10 transition-all"
                >
                  <Filter className="w-5 h-5" />
                  Filters
                </button>
                {userType === 'brand' && (
                  <Link
                    to="/submit-sponsorship"
                    className="flex items-center gap-2 px-4 py-2 bg-neon-green text-black rounded-lg hover:bg-[#00CC00] transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    New Sponsorship
                  </Link>
                )}
              </div>

              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 backdrop-blur-lg rounded-lg p-6 mb-8 border border-neon-green/20"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Amount Range (₹)
                      </label>
                      <div className="space-y-2">
                        <input
                          type="range"
                          min="100"
                          max="500000"
                          step="1000"
                          value={filters.amount[1]}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            amount: [prev.amount[0], parseInt(e.target.value)]
                          }))}
                          className="w-full accent-neon-green"
                        />
                        <div className="flex justify-between text-sm text-gray-400">
                          <span>₹{filters.amount[0].toLocaleString()}</span>
                          <span>₹{filters.amount[1].toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Event Category
                      </label>
                      <select
                        value={filters.category}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          category: e.target.value
                        }))}
                        className="w-full px-3 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none"
                      >
                        <option value="all" className="bg-black">All Categories</option>
                        {categories.map(category => (
                          <option key={category} value={category} className="bg-black">
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Application Deadline
                      </label>
                      <select
                        value={filters.deadline}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          deadline: e.target.value
                        }))}
                        className="w-full px-3 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none"
                      >
                        <option value="all" className="bg-black">All Deadlines</option>
                        <option value="week" className="bg-black">Within 1 Week</option>
                        <option value="month" className="bg-black">Within 1 Month</option>
                        <option value="quarter" className="bg-black">Within 3 Months</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end mt-4">
                    <button
                      onClick={() => {
                        console.log("Resetting all filters");
                        setFilters({
                          amount: [100, 500000],
                          category: 'all',
                          deadline: 'all'
                        });
                        setSearchTerm('');
                      }}
                      className="flex items-center gap-2 px-4 py-2 border border-neon-green/20 rounded-lg text-white hover:bg-neon-green/5 transition-all"
                    >
                      <X className="w-4 h-4" />
                      Reset Filters
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Sort Options */}
            <div className="flex justify-end mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleSort('amount')}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                  Amount
                  {sortConfig.key === 'amount' && (
                    sortConfig.direction === 'asc' ? 
                    <ChevronUp className="w-4 h-4" /> : 
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleSort('event_date')}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                  Event Date
                  {sortConfig.key === 'event_date' && (
                    sortConfig.direction === 'asc' ? 
                    <ChevronUp className="w-4 h-4" /> : 
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleSort('deadline')}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                  Deadline
                  {sortConfig.key === 'deadline' && (
                    sortConfig.direction === 'asc' ? 
                    <ChevronUp className="w-4 h-4" /> : 
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Sponsorship Listings */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSponsorships.length > 0 ? (
                filteredSponsorships.map((sponsorship) => (
                  <motion.div
                    key={sponsorship.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 backdrop-blur-lg rounded-xl overflow-hidden border border-neon-green/20 hover:border-neon-green/40 transition-all"
                  >
                    <div className="p-6">
                      {sponsorship.brandLogo && (
                        <div className="mb-4 flex justify-center">
                          <img
                            src={sponsorship.brandLogo}
                            alt={`${sponsorship.title} brand logo`}
                            className="w-24 h-24 object-contain rounded-lg bg-white/5 p-2"
                          />
                        </div>
                      )}
                      <h3 className="text-xl font-semibold text-white mb-4">{sponsorship.title}</h3>

                      <div className="flex items-center gap-2 text-neon-green mb-4">
                        <IndianRupee className="w-5 h-5" />
                        <span className="text-2xl font-semibold">
                          {sponsorship.amount.toLocaleString()}
                        </span>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-2 text-gray-300">
                          <Calendar className="w-4 h-4" />
                          <span>Category: {sponsorship.event_category || 'Not specified'}</span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-300">
                          <Users className="w-4 h-4" />
                          <span>Expected Footfall: {sponsorship.expected_footfall?.toLocaleString() || 'Not specified'}</span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-300">
                          <Calendar className="w-4 h-4" />
                          <span>Event Date: {sponsorship.event_date ? new Date(sponsorship.event_date).toLocaleDateString() : 'Not specified'}</span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-300">
                          <Clock className="w-4 h-4" />
                          <span>Deadline: {sponsorship.application_deadline ? getTimeLeft(sponsorship.application_deadline) : 'Not specified'}</span>
                        </div>
                      </div>

                      <p className="text-gray-400 line-clamp-2 mb-4">
                        {sponsorship.description || 'No description provided'}
                      </p>

                      {/* Show accepted status if sponsorship is accepted */}
                      {sponsorship.isAccepted && userType === 'university' && (
                        <div className="bg-neon-green/10 border border-neon-green/30 rounded-lg p-3 mb-4 flex items-center gap-2">
                          <CheckCircle className="text-neon-green w-4 h-4" />
                          <p className="text-neon-green text-sm font-medium">You've accepted this sponsorship</p>
                        </div>
                      )}

                      <button
                        onClick={() => openSponsorshipDetails(sponsorship)}
                        className="flex items-center justify-center gap-2 w-full py-2 mt-4 bg-neon-green/10 border border-neon-green text-neon-green rounded-lg font-semibold hover:bg-neon-green hover:text-black transition-all"
                      >
                        <span>View Details</span>
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-3 text-center py-12">
                  <p className="text-gray-400 text-lg">No sponsorship opportunities found matching your criteria.</p>
                  <button
                    onClick={() => {
                      console.log("Resetting filters due to no results");
                      setFilters({
                        amount: [100, 500000],
                        category: 'all',
                        deadline: 'all'
                      });
                      setSearchTerm('');
                    }}
                    className="mt-4 px-6 py-2 border border-neon-green/20 rounded-lg text-white hover:bg-neon-green/5 transition-all"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Sponsorship Request Status Tab */}
        {activeTab === 'status' && (
          <div className="bg-white/5 backdrop-blur-lg rounded-lg p-8 border border-neon-green/20">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Sponsorship Request Status</h2>
              <p className="text-gray-300 mb-6">This feature is coming soon. You'll be able to track the status of your sponsorship requests here.</p>
            </div>
          </div>
        )}

        {/* Sponsorship Detail Modal */}
        {showModal && selectedSponsorship && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-900 border border-neon-green/30 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-gray-900 border-b border-neon-green/20 p-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Sponsorship Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="mb-6">
                  {selectedSponsorship.brandLogo && (
                    <div className="mb-4 flex justify-center">
                      <img
                        src={selectedSponsorship.brandLogo}
                        alt={`${selectedSponsorship.title} brand logo`}
                        className="w-32 h-32 object-contain rounded-lg bg-white/5 p-3"
                      />
                    </div>
                  )}
                  <h1 className="text-2xl font-bold text-white mb-2">{selectedSponsorship.title}</h1>
                  
                  <div className="flex items-center gap-2 text-neon-green mb-4">
                    <IndianRupee className="w-6 h-6" />
                    <span className="text-3xl font-semibold">
                      {selectedSponsorship.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Details</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-gray-400 mb-1">Category</p>
                        <p className="text-white">{selectedSponsorship.event_category || 'Not specified'}</p>
                        </div>
                      
                      <div>
                        <p className="text-gray-400 mb-1">Event Date</p>
                        <p className="text-white">
                          {selectedSponsorship.event_date ? new Date(selectedSponsorship.event_date).toLocaleDateString() : 'Not specified'}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-gray-400 mb-1">Application Deadline</p>
                        <p className="text-white">
                          {selectedSponsorship.application_deadline ? (
                            <>
                              {new Date(selectedSponsorship.application_deadline).toLocaleDateString()} 
                              <span className="ml-2 px-2 py-1 bg-neon-green/10 text-neon-green text-xs rounded-full">
                                {getTimeLeft(selectedSponsorship.application_deadline)}
                              </span>
                            </>
                          ) : 'Not specified'}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-gray-400 mb-1">Expected Footfall</p>
                        <p className="text-white">{selectedSponsorship.expected_footfall?.toLocaleString() || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Description</h3>
                    <p className="text-gray-300 whitespace-pre-line">
                      {selectedSponsorship.description || 'No description provided'}
                    </p>
                    
                    <h3 className="text-lg font-semibold text-white mt-6 mb-4">Requirements</h3>
                    <p className="text-gray-300 whitespace-pre-line">
                      {selectedSponsorship.requirements || 'No specific requirements provided'}
                    </p>
                    
                    <h3 className="text-lg font-semibold text-white mt-6 mb-4">Target Criteria</h3>
                    <p className="text-gray-300 whitespace-pre-line">
                      {selectedSponsorship.target_criteria || 'No target criteria specified'}
                    </p>
                  </div>
                </div>
                
                {/* Accept Sponsorship Section */}
                {userType === 'university' && (
                  <div className="mt-8 border-t border-neon-green/20 pt-6">
                    {!profileComplete ? (
                      <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4 flex items-center gap-3">
                        <AlertCircle className="text-amber-400 w-6 h-6 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-amber-400 font-medium">Complete your profile first</p>
                          <p className="text-amber-300/80 text-sm mt-1">
                            You need to complete your university profile before you can accept sponsorships.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setActiveTab('profile');
                            setShowModal(false);
                          }}
                          className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded-lg transition-colors whitespace-nowrap"
                        >
                          Complete Profile
                        </button>
                      </div>
                    ) : alreadyAccepted ? (
                      <div className="bg-neon-green/10 border border-neon-green/30 rounded-lg p-4 flex items-center gap-3">
                        <CheckCircle className="text-neon-green w-6 h-6" />
                        <p className="text-neon-green font-medium">You have already accepted this sponsorship opportunity.</p>
                      </div>
                    ) : acceptSuccess ? (
                      <div className="bg-neon-green/10 border border-neon-green/30 rounded-lg p-4 flex items-center gap-3">
                        <CheckCircle className="text-neon-green w-6 h-6" />
                        <p className="text-neon-green font-medium">Sponsorship accepted successfully! The brand will contact you soon.</p>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-lg font-semibold text-white mb-4">Accept This Sponsorship</h3>
                        <p className="text-gray-400 mb-4">
                          By accepting this sponsorship, you agree to the requirements and will be contacted by the brand for further details.
                        </p>
                        
                        {acceptError && (
                          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4 flex items-center gap-3">
                            <XCircle className="text-red-500 w-6 h-6" />
                            <p className="text-red-500">{acceptError}</p>
                          </div>
                        )}
                        
                        <button
                          onClick={handleAcceptSponsorship}
                          disabled={acceptLoading}
                          className={`flex items-center justify-center gap-2 w-full md:w-auto px-8 py-3 bg-neon-green text-black rounded-lg font-semibold hover:bg-[#00CC00] transition-all ${
                            acceptLoading ? 'opacity-70 cursor-not-allowed' : ''
                          }`}
                        >
                          {acceptLoading ? 'Processing...' : 'Accept Sponsorship'}
                          {!acceptLoading && <CheckCircle className="w-5 h-5" />}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sponsorships;