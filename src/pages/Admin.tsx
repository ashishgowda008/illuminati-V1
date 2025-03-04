import React, { useState, useEffect } from 'react';
import { motion, time } from 'framer-motion';
import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  School,
  Clock,
  Activity,
  BarChart3,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  RefreshCw,
  Filter,
  Search,
  Eye,
  EyeOff,
  Copy,
  Check,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Key
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
interface SponsorshipRequest {
  id: string;
  user_id: string;
  title: string;
  description: string;
  amount: number;
  requirements: string;
  target_criteria: string;
  event_date: string;
  event_category: string;
  expected_footfall: number;
  application_deadline: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewer_id?: string;
  review_date?: string;
  brand_info?: {
    name: string;
    industry: string;
  };
}

interface UniversitySponsorshipRequest {
  id: string;
  created_at: string;
  company_id: string | null;
  description: string | null;
  amount: string | null;
  event_date: string | null;
  event_category: string | null;
  accepted_by: string | null;
  reviewer_id: string | null;
  review_date: string | null;
  status: string | null;
  feedback: string | null;
  university_id: string | null;
  university_name: string | null;
  university_url: string | null;
}

interface Credential {
  username: string;
  password: string;
  user_type: 'university' | 'brand';
  is_assigned: boolean;
  assigned_to?: string;
  last_used?: string;
  created_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  interface DashboardStats {
    totalBrands: number;
    totalUniversities: number;
    pendingRequests: number;
    totalSponshorships: number;
    studentWaitlist: StudentWaitlist[];
    growthStats: {
      brands: number;
      universities: number;
      sponsorships: number;
    }
  }

  const [stats, setStats] = useState<DashboardStats>({
    totalBrands: 0,
    totalUniversities: 0,
    pendingRequests: 0,
    totalSponshorships: 0,
    studentWaitlist: [],
    growthStats: {
      brands: 0,
      universities: 0,
      sponsorships: 0
    }
  });
  const [showStudentWaitlistModal, setShowStudentWaitlistModal] = useState(false);
  const [showApprovedSponsorshipsModal, setShowApprovedSponsorshipsModal] = useState(false);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [approvedSponsorships, setApprovedSponsorships] = useState<SponsorshipRequest[]>([]);
  const [insightsData, setInsightsData] = useState<{
    signups: { date: string; count: number }[];
    totalUniversities: number;
    totalBrands: number;
    universities: any[];
    brands: any[];
  }>({
    signups: [],
    totalUniversities: 0,
    totalBrands: 0,
    universities: [],
    brands: []
  });
  const [showUniversitiesModal, setShowUniversitiesModal] = useState(false);
  const [showBrandsModal, setShowBrandsModal] = useState(false);
  
  interface StudentWaitlist {
    id: string;
    name: string;
    email: string;
    phone: string;
    university: string;
    created_at: string;
  }
  const [sponsorshipRequests, setSponsorshipRequests] = useState<SponsorshipRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<SponsorshipRequest | null>(null);
  const [showPendingRequestsModal, setShowPendingRequestsModal] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<SponsorshipRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({
    key: 'created_at',
    direction: 'desc'
  });

  // University sponsorship requests
  const [pendingUniversityRequests, setPendingUniversityRequests] = useState<UniversitySponsorshipRequest[]>([]);
  const [selectedUniversityRequest, setSelectedUniversityRequest] = useState<UniversitySponsorshipRequest | null>(null);
  const [showUniversityFeedbackModal, setShowUniversityFeedbackModal] = useState(false);
  const [universityFeedbackText, setUniversityFeedbackText] = useState('');

  // Credentials management state
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [credentialFilter, setCredentialFilter] = useState('all');
  const [credentialSearch, setCredentialSearch] = useState('');
  const [copiedItem, setCopiedItem] = useState<{id: string, type: 'username' | 'password'} | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      const { data, error } = await supabase
        .from('predefined_credentials')
        .select('*')
        .order('username', { ascending: true });

      if (error) throw error;
      setCredentials(data || []);
    } catch (error) {
      console.error('Error loading credentials:', error);
    }
  };

  const loadPendingRequests = async () => {
    try {
      console.log('Loading pending requests');
      const { data, error } = await supabase
        .from('sponsorship_requests')
        .select(`
          id,
          user_id,
          title,
          description,
          amount,
          event_date,
          event_category,
          application_deadline,
          status,
          requirements,
          target_criteria,
          expected_footfall,
          created_at,
          feedback
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Pending requests loaded:', data);
      const requests = data || [];
      setPendingRequests(requests);
      
      // Update the pending requests count in stats
      setStats(prevStats => ({
        ...prevStats,
        pendingRequests: requests.length
      }));
    } catch (error) {
      console.error('Error loading pending requests:', error);
    }
  };

  const loadPendingUniversityRequests = async () => {
    try {
      console.log('Loading pending university requests');
      const { data, error } = await supabase
        .from('sponsership_requests_university')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Pending university requests loaded:', data);
      setPendingUniversityRequests(data || []);
    } catch (error) {
      console.error('Error loading pending university requests:', error);
    }
  };

  const loadStudentWaitlist = async () => {
    try {
      const { data, error } = await supabase
        .from('student_waitlist')
        .select('id, name, email, phone, university, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setStats(prevStats => ({
        ...prevStats,
        studentWaitlist: data || [],
        totalUniversities: data?.length || 0
      }));
    } catch (error) {
      console.error('Error loading student waitlist:', error);
    }
  };

  const loadInsightsData = async () => {
    try {
      // Fetch signup data and credential counts in parallel
      const [signupResponse, credsResponse] = await Promise.all([
        supabase
          .from('student_waitlist')
          .select('created_at')
          .order('created_at'),
        supabase
          .from('predefined_credentials')
          .select('user_type, username, password, created_at')
      ]);

      if (signupResponse.error) throw signupResponse.error;
      if (credsResponse.error) throw credsResponse.error;

      // Calculate totals from raw data
      const credentials = credsResponse.data || [];
      const totalUniversities = credentials.filter(c => c.user_type === 'university').length;
      const totalBrands = credentials.filter(c => c.user_type === 'brand').length;

      // Process signup data
      const signupsByDate = (signupResponse.data || []).reduce((acc: {[key: string]: number}, curr) => {
        const date = new Date(curr.created_at).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      const signups = Object.entries(signupsByDate)
        .sort((a, b) => a[0].localeCompare(b[0])) // Sort by date
        .map(([date, count]) => ({
          date,
          count
        }));

      // Create university and brand lists
      const universities = credentials.filter(c => c.user_type === 'university');
      const brands = credentials.filter(c => c.user_type === 'brand');

      setInsightsData({
        signups,
        totalUniversities: universities.length,
        totalBrands: brands.length,
        universities,
        brands
      });

      console.log('Insights data loaded:', {
        signupsCount: signups.length,
        totalUniversities,
        totalBrands
      });

    } catch (error) {
      console.error('Error loading insights data:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadPendingRequests(),
        loadPendingUniversityRequests(),
        loadStudentWaitlist(),
        loadInsightsData()
      ]);
// Fetch dashboard stats, pending and approved requests count
const [statsResponse, pendingCountResponse, approvedResponse] = await Promise.all([
 supabase
   .from('dashboard_stats')
   .select('*')
   .order('stat_date', { ascending: false })
   .limit(1),
 supabase
   .from('sponsorship_requests')
   .select('id', { count: 'exact', head: true })
   .eq('status', 'pending'),
 supabase
   .from('sponsorship_requests')
   .select(`
     id,
     title,
     description,
     amount,
     requirements,
     target_criteria,
     event_date,
     event_category,
     expected_footfall,
     application_deadline,
     reviewer_id,
     review_date,
     created_at,
     user_id,
     status
   `)
   .eq('status', 'approved')
   .order('created_at', { ascending: false })
]);

const statsData = statsResponse.data;
const approvedSponshorships = approvedResponse.data || [];
const pendingCount = pendingCountResponse.count || 0;
setApprovedSponsorships(approvedSponshorships);

      if (statsData && statsData[0]) {
        setStats(prevStats => ({
          ...prevStats,
          totalBrands: statsData[0].total_brands || 0,
          totalUniversities: prevStats.studentWaitlist.length,
          pendingRequests: pendingCount,
          totalSponshorships: approvedSponshorships.length,
          growthStats: {
            brands: 0,
            universities: 0,
            sponsorships: 0
          }
        }));
      }

      // Fetch sponsorship requests
      const { data: requestsData } = await supabase
        .from('sponsorship_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestsData) {
        setSponsorshipRequests(requestsData);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    await loadCredentials();
    setIsRefreshing(false);
  };

  const handleCopy = async (text: string, id: string, type: 'username' | 'password') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem({ id, type });
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleRequestAction = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      console.log('Processing request action:', { requestId, status });
      setProcessingRequestId(requestId);
      
      // Use the RPC function with proper reviewer info
      const { error: updateError } = await supabase.rpc('admin_update_request_status', {
        p_request_id: requestId,
        p_status: status
      });
  
      if (updateError) {
        console.error('Update error details:', updateError);
        throw updateError;
      }
  
      // If update succeeded, refresh data
      await loadPendingRequests();
      setSelectedRequest(null);
      alert(`Request ${status} successfully`);
      
    } catch (error: any) {
      console.error('Error details:', error);
      alert(`Error updating request status: ${error.message}`);
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleFeedback = async () => {
    if (!selectedRequest || !feedbackText.trim()) return;
  
    try {
      console.log('Submitting feedback for request:', selectedRequest.id);
      setProcessingRequestId(selectedRequest.id);
  
      // First update the status to "changes_requested"
      const { error: statusError } = await supabase.rpc('admin_update_request_status', {
        p_request_id: selectedRequest.id,
        p_status: 'changes_requested'
      });
  
      if (statusError) {
        console.error('Status update error details:', statusError);
        throw statusError;
      }
  
      // Then update the feedback
      const { error: feedbackError } = await supabase.rpc('admin_update_request_feedback', {
        p_request_id: selectedRequest.id,
        p_feedback: feedbackText
      });
  
      if (feedbackError) {
        console.error('Feedback update error details:', feedbackError);
        throw feedbackError;
      }
  
      // Reset state and refresh data
      setFeedbackText('');
      setShowFeedbackModal(false);
      setSelectedRequest(null);
      await loadPendingRequests();
      alert('Feedback submitted and status updated to "changes requested"');
      
    } catch (error: any) {
      console.error('Error details:', error);
      alert(`Error submitting feedback: ${error.message}`);
    } finally {
      setProcessingRequestId(null);
    }
  };

  // Handle university sponsorship request actions
  const handleUniversityRequestAction = async (requestId: string, status: 'approved' | 'rejected' | 'changes_requested') => {
    try {
      console.log('Processing university request action:', { requestId, status });
      setProcessingRequestId(requestId);
      
      const currentDateTime = new Date().toISOString();
      const adminId = 'admin'; // You might want to use a real admin ID here
      
      // Update the request status
      const { error: updateError } = await supabase
        .from('sponsership_requests_university')
        .update({ 
          status: status,
          reviewer_id: adminId,
          review_date: currentDateTime
        })
        .eq('id', requestId);
  
      if (updateError) {
        console.error('Update error details:', updateError);
        throw updateError;
      }
  
      // If update succeeded, refresh data
      await loadPendingUniversityRequests();
      setSelectedUniversityRequest(null);
      alert(`University request ${status} successfully`);
      
    } catch (error: any) {
      console.error('Error details:', error);
      alert(`Error updating university request status: ${error.message}`);
    } finally {
      setProcessingRequestId(null);
    }
  };

  // Handle university feedback submission
  const handleUniversityFeedback = async () => {
    if (!selectedUniversityRequest || !universityFeedbackText.trim()) return;
  
    try {
      console.log('Submitting feedback for university request:', selectedUniversityRequest.id);
      setProcessingRequestId(selectedUniversityRequest.id);
      
      const currentDateTime = new Date().toISOString();
      const adminId = 'admin'; // You might want to use a real admin ID here
      
      // Update status and feedback
      const { error: updateError } = await supabase
        .from('sponsership_requests_university')
        .update({ 
          status: 'changes_requested',
          feedback: universityFeedbackText,
          reviewer_id: adminId,
          review_date: currentDateTime
        })
        .eq('id', selectedUniversityRequest.id);
  
      if (updateError) {
        console.error('Update error details:', updateError);
        throw updateError;
      }
  
      // Reset state and refresh data
      setUniversityFeedbackText('');
      setShowUniversityFeedbackModal(false);
      setSelectedUniversityRequest(null);
      await loadPendingUniversityRequests();
      alert('Feedback submitted and university request status updated to "changes requested"');
      
    } catch (error: any) {
      console.error('Error details:', error);
      alert(`Error submitting university feedback: ${error.message}`);
    } finally {
      setProcessingRequestId(null);
    }
  };

  const filteredCredentials = credentials.filter(cred => {
    const matchesSearch = 
      cred.username.includes(credentialSearch) || 
      (cred.assigned_to?.toLowerCase().includes(credentialSearch.toLowerCase()) ?? false);
    
    const matchesFilter = 
      credentialFilter === 'all' || 
      (credentialFilter === 'assigned' && cred.is_assigned) || 
      (credentialFilter === 'available' && !cred.is_assigned) ||
      credentialFilter === cred.user_type;

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen pt-16 bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-400">Manage sponsorships and monitor platform activity</p>
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-neon-green/20 cursor-pointer hover:bg-neon-green/5 transition-all"
            onClick={() => setShowInsightsModal(true)}
          >
            <div className="flex items-center justify-between">
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <BarChart3 className="w-6 h-6 text-indigo-500" />
              </div>
              <span className="text-sm text-gray-400">Platform Insights</span>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold text-white">‎ </h3>
              <p className="text-gray-400 text-sm mt-2">Click to check insights</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-neon-green/20 cursor-pointer hover:bg-neon-green/5 transition-all"
            onClick={() => setShowStudentWaitlistModal(true)}
          >
            <div className="flex items-center justify-between">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Users className="w-6 h-6 text-purple-500" />
              </div>
              <span className="text-sm text-gray-400">Student Waitlist</span>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold text-white">{stats.totalUniversities}</h3>
              <p className="text-gray-400 text-sm mt-2">Click to view details</p>
            </div>
          </motion.div>

          <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
           className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-neon-green/20 cursor-pointer hover:bg-neon-green/5 transition-all"
           onClick={() => setShowPendingRequestsModal(true)}
         >
           <div className="flex items-center justify-between">
             <div className="p-2 bg-yellow-500/10 rounded-lg">
               <Clock className="w-6 h-6 text-yellow-500" />
             </div>
             <span className="text-sm text-gray-400">Pending Requests</span>
           </div>
           <div className="mt-4">
             <h3 className="text-3xl font-bold text-white">{stats.pendingRequests + pendingUniversityRequests.length}</h3>
             <p className="text-gray-400 text-sm mt-2">Click to view details</p>
           </div>
         </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-neon-green/20 cursor-pointer hover:bg-neon-green/5 transition-all"
            onClick={() => setShowApprovedSponsorshipsModal(true)}
          >
            <div className="flex items-center justify-between">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Activity className="w-6 h-6 text-green-500" />
              </div>
              <span className="text-sm text-gray-400">Total Sponsorships</span>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold text-white">{stats.totalSponshorships}</h3>
              <p className="flex items-center mt-2 text-sm">
                <span className="text-gray-400 ml-2">Click to View Sponsorships</span>
              </p>
            </div>
          </motion.div>
        </div>

        {/* Credentials Management */}
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-neon-green/20 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white">Predefined Credentials</h2>
              <p className="text-gray-400">Manage university and brand login credentials</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowPasswords(prev => {
                  const allUsernames = credentials.map(c => c.username);
                  return Object.keys(prev).length > 0 
                    ? {} 
                    : Object.fromEntries(allUsernames.map(u => [u, true]));
                })}
                className="p-2 rounded-lg border border-neon-green/20 text-white hover:bg-neon-green/5 transition-all"
                title={Object.keys(showPasswords).length > 0 ? "Hide All Passwords" : "Show All Passwords"}
              >
                {Object.keys(showPasswords).length > 0 ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={() => {
                  const csvData = credentials.map(cred => ({
                    Username: cred.username,
                    Password: cred.password,
                    Type: cred.user_type,
                    Status: cred.is_assigned ? 'Assigned' : 'Available',
                    'Assigned To': cred.assigned_to || '',
                    'Last Used': cred.last_used || ''
                  }));

                  const csvContent = [
                    Object.keys(csvData[0]).join(','),
                    ...csvData.map(row => Object.values(row).join(','))
                  ].join('\n');

                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `credentials-${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                }}
                className="p-2 rounded-lg border border-neon-green/20 text-white hover:bg-neon-green/5 transition-all"
                title="Export Credentials"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by username or assigned to..."
                value={credentialSearch}
                onChange={(e) => setCredentialSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none"
              />
            </div>
            <select
              value={credentialFilter}
              onChange={(e) => setCredentialFilter(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none"
            >
              <option value="all" className="bg-black">All Credentials</option>
              <option value="university" className="bg-black">Universities</option>
              <option value="brand" className="bg-black">Brands</option>
              <option value="assigned" className="bg-black">Assigned</option>
              <option value="available" className="bg-black">Available</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-white/10">
                  <th className="p-4 text-gray-400 font-medium">Username</th>
                  <th className="p-4 text-gray-400 font-medium">Password</th>
                  <th className="p-4 text-gray-400 font-medium">Type</th>
                  <th className="p-4 text-gray-400 font-medium">Status</th>
                  <th className="p-4 text-gray-400 font-medium">Assigned To</th>
                  <th className="p-4 text-gray-400 font-medium">Last Used</th>
                  <th className="p-4 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCredentials.map((cred) => (
                  <tr key={cred.username} className="border-b border-white/10">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-mono">{cred.username}</span>
                        <button
                          onClick={() => handleCopy(cred.username, cred.username, 'username')}
                          className="p-1 text-gray-400 hover:text-white transition-colors"
                          title="Copy Username"
                        >
                          {copiedItem?.id === cred.username && copiedItem?.type === 'username' ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-white">
                          {showPasswords[cred.username] ? cred.password : '••••••••'}
                        </span>
                        <button
                          onClick={() => setShowPasswords(prev => ({
                            ...prev,
                            [cred.username]: !prev[cred.username]
                          }))}
                          className="p-1 text-gray-400 hover:text-white transition-colors"
                          title={showPasswords[cred.username] ? "Hide Password" : "Show Password"}
                        >
                          {showPasswords[cred.username] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleCopy(cred.password, cred.username, 'password')}
                          className="p-1 text-gray-400 hover:text-white transition-colors"
                          title="Copy Password"
                        >
                          {copiedItem?.id === cred.username && copiedItem?.type === 'password' ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        cred.user_type === 'university'
                          ? 'bg-purple-500/20 text-purple-500'
                          : 'bg-blue-500/20 text-blue-500'
                      }`}>
                        {cred.user_type.charAt(0).toUpperCase() + cred.user_type.slice(1)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        cred.is_assigned 
                          ? 'bg-green-500/20 text-green-500' 
                          : 'bg-yellow-500/20 text-yellow-500'
                      }`}>
                        {cred.is_assigned ? 'Assigned' : 'Available'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400">
                      {cred.assigned_to || '-'}
                    </td>
                    <td className="p-4 text-gray-400">
                      {cred.last_used ? new Date(cred.last_used).toLocaleString() : 'Never'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          className="p-1 text-gray-400 hover:text-white transition-colors"
                          title="View Details"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

                </div>

                {/* Pending Requests Modal */}
                {showPendingRequestsModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-black/95 rounded-xl border border-neon-green/20 p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Pending Requests</h2>
                    <button
                      onClick={() => setShowPendingRequestsModal(false)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>
                  
                  {/* Brand requests section */}
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-white mb-4">Pending Sponsorship Requests by Brands</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left border-b border-white/10">
                            <th className="p-4 text-gray-400 font-medium">Title</th>
                            <th className="p-4 text-gray-400 font-medium">Category</th>
                            <th className="p-4 text-gray-400 font-medium">Amount</th>
                            <th className="p-4 text-gray-400 font-medium">Event Date</th>
                            <th className="p-4 text-gray-400 font-medium">Deadline</th>
                            <th className="p-4 text-gray-400 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendingRequests.length > 0 ? (
                            pendingRequests.map((request) => (
                              <tr key={request.id} className="border-b border-white/10">
                                <td className="p-4">
                                  <div>
                                    <p className="text-white font-medium">{request.title}</p>
                                    <p className="text-gray-400 text-sm mt-1">{request.description.slice(0, 50)}...</p>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded-full text-xs">
                                    {request.event_category}
                                  </span>
                                </td>
                                <td className="p-4 text-white">₹{request.amount.toLocaleString()}</td>
                                <td className="p-4 text-gray-400">
                                  {new Date(request.event_date).toLocaleDateString()}
                                </td>
                                <td className="p-4 text-gray-400">
                                  {new Date(request.application_deadline).toLocaleDateString()}
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => setSelectedRequest(request)}
                                      className="p-2 bg-neon-green/10 text-neon-green rounded-lg hover:bg-neon-green/20 transition-all"
                                      title="View Details"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="p-4 text-center text-gray-400">
                                No pending brand requests
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* University requests section */}
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Pending Sponsorship Requests by Universities</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left border-b border-white/10">
                            <th className="p-4 text-gray-400 font-medium">University</th>
                            <th className="p-4 text-gray-400 font-medium">Description</th>
                            <th className="p-4 text-gray-400 font-medium">Amount</th>
                            <th className="p-4 text-gray-400 font-medium">Event Date</th>
                            <th className="p-4 text-gray-400 font-medium">Category</th>
                            <th className="p-4 text-gray-400 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendingUniversityRequests.length > 0 ? (
                            pendingUniversityRequests.map((request) => (
                              <tr key={request.id} className="border-b border-white/10">
                                <td className="p-4">
                                  <div>
                                    <p className="text-white font-medium">{request.university_name || "University"}</p>
                                    <p className="text-gray-400 text-sm mt-1">{request.university_url || "-"}</p>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <p className="text-white">
                                    {request.description ? 
                                      request.description.length > 50 ? 
                                        request.description.slice(0, 50) + '...' : 
                                        request.description : 
                                      "-"}
                                  </p>
                                </td>
                                <td className="p-4 text-white">{request.amount || "-"}</td>
                                <td className="p-4 text-gray-400">
                                  {request.event_date ? new Date(request.event_date).toLocaleDateString() : "-"}
                                </td>
                                <td className="p-4">
                                  <span className="px-2 py-1 bg-purple-500/10 text-purple-500 rounded-full text-xs">
                                    {request.event_category || "General"}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => setSelectedUniversityRequest(request)}
                                      className="p-2 bg-neon-green/10 text-neon-green rounded-lg hover:bg-neon-green/20 transition-all"
                                      title="View Details"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="p-4 text-center text-gray-400">
                                No pending university requests
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                </div>
                )}

                {/* Request Details Modal (for brand requests) */}
                {selectedRequest && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-black/95 rounded-xl border border-neon-green/20 p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Brand Request Details</h2>
                    <button
                      onClick={() => setSelectedRequest(null)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">{selectedRequest.title}</h3>
                      <p className="text-gray-400">{selectedRequest.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-400">Event Category</p>
                        <p className="text-white font-medium">{selectedRequest.event_category}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Amount Requested</p>
                        <p className="text-white font-medium">₹{selectedRequest.amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Expected Footfall</p>
                        <p className="text-white font-medium">{selectedRequest.expected_footfall.toLocaleString()} attendees</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Event Date</p>
                        <p className="text-white font-medium">{new Date(selectedRequest.event_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Application Deadline</p>
                        <p className="text-white font-medium">{new Date(selectedRequest.application_deadline).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Status</p>
                        <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-sm">
                          {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-white font-medium mb-2">Requirements</h4>
                      <p className="text-gray-400">{selectedRequest.requirements}</p>
                    </div>

                    <div>
                      <h4 className="text-white font-medium mb-2">Target Criteria</h4>
                      <p className="text-gray-400">{selectedRequest.target_criteria}</p>
                    </div>

                    <div className="flex gap-4 justify-end pt-4 border-t border-white/10">
                      <button
                        onClick={() => handleRequestAction(selectedRequest.id, 'rejected')}
                        disabled={!!processingRequestId}
                        className="px-4 py-2 text-white bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-all disabled:opacity-50"
                      >
                        {processingRequestId === selectedRequest.id ? 'Processing...' : 'Reject'}
                      </button>
                      <button
                        onClick={() => setShowFeedbackModal(true)}
                        disabled={!!processingRequestId}
                        className="px-4 py-2 text-white bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg transition-all disabled:opacity-50"
                      >
                        Request Changes
                      </button>
                      <button
                        onClick={() => handleRequestAction(selectedRequest.id, 'approved')}
                        disabled={!!processingRequestId}
                        className="px-4 py-2 text-white bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-all disabled:opacity-50"
                      >
                        {processingRequestId === selectedRequest.id ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => setSelectedRequest(null)}
                        disabled={!!processingRequestId}
                        className="px-4 py-2 text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all disabled:opacity-50"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
                </div>
                )}

                {/* University Request Details Modal */}
                {selectedUniversityRequest && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-black/95 rounded-xl border border-neon-green/20 p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">University Request Details</h2>
                    <button
                      onClick={() => setSelectedUniversityRequest(null)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">{selectedUniversityRequest.university_name || "University"}</h3>
                      <p className="text-gray-400">{selectedUniversityRequest.description || "No description provided"}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-400">Event Category</p>
                        <p className="text-white font-medium">{selectedUniversityRequest.event_category || "Not specified"}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Amount Requested</p>
                        <p className="text-white font-medium">{selectedUniversityRequest.amount || "Not specified"}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">University Website</p>
                        <p className="text-white font-medium">{selectedUniversityRequest.university_url || "Not provided"}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Event Date</p>
                        <p className="text-white font-medium">
                          {selectedUniversityRequest.event_date ? 
                            new Date(selectedUniversityRequest.event_date).toLocaleDateString() : 
                            "Not specified"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">University ID</p>
                        <p className="text-white font-medium">{selectedUniversityRequest.university_id || "Not available"}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Status</p>
                        <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-sm">
                          {(selectedUniversityRequest.status || "pending").charAt(0).toUpperCase() + 
                            (selectedUniversityRequest.status || "pending").slice(1)}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-4 justify-end pt-4 border-t border-white/10">
                      <button
                        onClick={() => handleUniversityRequestAction(selectedUniversityRequest.id, 'rejected')}
                        disabled={!!processingRequestId}
                        className="px-4 py-2 text-white bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-all disabled:opacity-50"
                      >
                        {processingRequestId === selectedUniversityRequest.id ? 'Processing...' : 'Reject'}
                      </button>
                      <button
                        onClick={() => setShowUniversityFeedbackModal(true)}
                        disabled={!!processingRequestId}
                        className="px-4 py-2 text-white bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg transition-all disabled:opacity-50"
                      >
                        Request Changes
                      </button>
                      <button
                        onClick={() => handleUniversityRequestAction(selectedUniversityRequest.id, 'approved')}
                        disabled={!!processingRequestId}
                        className="px-4 py-2 text-white bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-all disabled:opacity-50"
                      >
                        {processingRequestId === selectedUniversityRequest.id ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => setSelectedUniversityRequest(null)}
                        disabled={!!processingRequestId}
                        className="px-4 py-2 text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all disabled:opacity-50"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
                </div>
                )}

                {/* Brand Feedback Modal */}
                {showFeedbackModal && selectedRequest && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                <div className="bg-black/95 rounded-xl border border-neon-green/20 p-6 max-w-lg w-full">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Request Changes</h2>
                    <button
                      onClick={() => setShowFeedbackModal(false)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Requesting Changes for {selectedRequest.title}
                      </label>
                      <textarea
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="Enter your feedback here..."
                        rows={4}
                        className="w-full px-4 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none resize-none"
                      />
                    </div>

                    <div className="flex gap-4 justify-end">
                      <button
                        onClick={() => setShowFeedbackModal(false)}
                        className="px-4 py-2 text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleFeedback}
                        disabled={!feedbackText.trim() || !!processingRequestId}
                        className="px-4 py-2 text-white bg-neon-green/20 hover:bg-neon-green/30 rounded-lg transition-all disabled:opacity-50"
                      >
                        {processingRequestId === selectedRequest.id ? 'Submitting...' : 'Submit Feedback'}
                      </button>
                    </div>
                  </div>
                </div>
                </div>
                )}

                {/* University Feedback Modal */}
                {showUniversityFeedbackModal && selectedUniversityRequest && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                <div className="bg-black/95 rounded-xl border border-neon-green/20 p-6 max-w-lg w-full">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Request Changes</h2>
                    <button
                      onClick={() => setShowUniversityFeedbackModal(false)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Requesting Changes for {selectedUniversityRequest.university_name || "University Request"}
                      </label>
                      <textarea
                        value={universityFeedbackText}
                        onChange={(e) => setUniversityFeedbackText(e.target.value)}
                        placeholder="Enter your feedback here..."
                        rows={4}
                        className="w-full px-4 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none resize-none"
                      />
                    </div>

                    <div className="flex gap-4 justify-end">
                      <button
                        onClick={() => setShowUniversityFeedbackModal(false)}
                        className="px-4 py-2 text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUniversityFeedback}
                        disabled={!universityFeedbackText.trim() || !!processingRequestId}
                        className="px-4 py-2 text-white bg-neon-green/20 hover:bg-neon-green/30 rounded-lg transition-all disabled:opacity-50"
                      >
                        {processingRequestId === selectedUniversityRequest.id ? 'Submitting...' : 'Submit Feedback'}
                      </button>
                    </div>
                  </div>
                </div>
                </div>
                )}

                {/* Student Waitlist Modal */}
                {showStudentWaitlistModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                          <div className="bg-black/95 rounded-xl border border-neon-green/20 p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Student Waitlist</h2>
              <button
                onClick={() => setShowStudentWaitlistModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-white/10">
                    <th className="p-4 text-gray-400 font-medium">Name</th>
                    <th className="p-4 text-gray-400 font-medium">Email</th>
                    <th className="p-4 text-gray-400 font-medium">Phone</th>
                    <th className="p-4 text-gray-400 font-medium">University</th>
                    <th className="p-4 text-gray-400 font-medium">Sign Up Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.studentWaitlist.map((student) => (
                    <tr key={student.id} className="border-b border-white/10">
                      <td className="p-4 text-white">{student.name}</td>
                      <td className="p-4 text-white">{student.email}</td>
                      <td className="p-4 text-white">{student.phone}</td>
                      <td className="p-4 text-white">{student.university}</td>
                      <td className="p-4 text-gray-400">
                        {new Date(student.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Approved Sponsorships Modal */}
      {showApprovedSponsorshipsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-black/95 rounded-xl border border-neon-green/20 p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Approved Sponsorships</h2>
              <button
                onClick={() => setShowApprovedSponsorshipsModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-white/10">
                    <th className="p-4 text-gray-400 font-medium">Title</th>
                    <th className="p-4 text-gray-400 font-medium">Description</th>
                    <th className="p-4 text-gray-400 font-medium">Amount</th>
                    <th className="p-4 text-gray-400 font-medium">Requirements</th>
                    <th className="p-4 text-gray-400 font-medium">Target Criteria</th>
                    <th className="p-4 text-gray-400 font-medium">Event Date</th>
                    <th className="p-4 text-gray-400 font-medium">Category</th>
                    <th className="p-4 text-gray-400 font-medium">Footfall</th>
                    <th className="p-4 text-gray-400 font-medium">Deadline</th>
                    <th className="p-4 text-gray-400 font-medium">Reviewer ID</th>
                    <th className="p-4 text-gray-400 font-medium">Review Date</th>
                    <th className="p-4 text-gray-400 font-medium">Created At</th>
                    <th className="p-4 text-gray-400 font-medium">Submitted By</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedSponsorships.map((sponsorship) => (
                    <tr key={sponsorship.id} className="border-b border-white/10">
                      <td className="p-4 text-white">{sponsorship.title}</td>
                      <td className="p-4 text-white max-w-xs truncate">{sponsorship.description}</td>
                      <td className="p-4 text-white">₹{sponsorship.amount.toLocaleString()}</td>
                      <td className="p-4 text-white max-w-xs truncate">{sponsorship.requirements}</td>
                      <td className="p-4 text-white max-w-xs truncate">{sponsorship.target_criteria}</td>
                      <td className="p-4 text-white">{new Date(sponsorship.event_date).toLocaleDateString()}</td>
                      <td className="p-4 text-white">{sponsorship.event_category}</td>
                      <td className="p-4 text-white">{sponsorship.expected_footfall.toLocaleString()}</td>
                      <td className="p-4 text-white">{new Date(sponsorship.application_deadline).toLocaleDateString()}</td>
                      <td className="p-4 text-white">{sponsorship.reviewer_id || '-'}</td>
                      <td className="p-4 text-white">{sponsorship.review_date ? new Date(sponsorship.review_date).toLocaleString() : '-'}</td>
                      <td className="p-4 text-white">{new Date(sponsorship.created_at).toLocaleString()}</td>
                      <td className="p-4 text-white">{sponsorship.user_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Insights Modal */}
      {showInsightsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-black/95 rounded-xl border border-neon-green/20 p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Platform Insights</h2>
              <button
                onClick={() => setShowInsightsModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div
                className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-neon-green/20 cursor-pointer hover:bg-neon-green/5 transition-all"
                onClick={() => setShowUniversitiesModal(true)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <School className="w-6 h-6 text-purple-500" />
                  </div>
                  <span className="text-sm text-gray-400">Active Universities</span>
                </div>
                <h3 className="text-3xl font-bold text-white">{insightsData.totalUniversities}</h3>
              </div>

              <div
                className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-neon-green/20 cursor-pointer hover:bg-neon-green/5 transition-all"
                onClick={() => setShowBrandsModal(true)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Building2 className="w-6 h-6 text-blue-500" />
                  </div>
                  <span className="text-sm text-gray-400">Active Brands</span>
                </div>
                <h3 className="text-3xl font-bold text-white">{insightsData.totalBrands}</h3>
              </div>

              {/* Universities Modal */}
              {showUniversitiesModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
                  <div className="bg-black/95 rounded-xl border border-neon-green/20 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-white">Universities</h2>
                      <button onClick={() => setShowUniversitiesModal(false)} className="text-gray-400 hover:text-white transition-colors">
                        <XCircle className="w-6 h-6" />
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left border-b border-white/10">
                            <th className="p-4 text-gray-400 font-medium">Username</th>
                            <th className="p-4 text-gray-400 font-medium">Password</th>
                            <th className="p-4 text-gray-400 font-medium">Created At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {credentials.filter(cred => cred.user_type === 'university').map(cred => (
                            <tr key={cred.username} className="border-b border-white/10">
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-white font-mono">{cred.username}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopy(cred.username, cred.username, 'username');
                                    }}
                                    className="p-1 text-gray-400 hover:text-white transition-colors"
                                  >
                                    {copiedItem?.id === cred.username && copiedItem?.type === 'username' ? (
                                      <Check className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <Copy className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-white font-mono">{cred.password}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopy(cred.password, cred.username, 'password');
                                    }}
                                    className="p-1 text-gray-400 hover:text-white transition-colors"
                                  >
                                    {copiedItem?.id === cred.username && copiedItem?.type === 'password' ? (
                                      <Check className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <Copy className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              </td>
                              <td className="p-4 text-gray-400">{new Date(cred.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Brands Modal */}
              {showBrandsModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
                  <div className="bg-black/95 rounded-xl border border-neon-green/20 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-white">Brands</h2>
                      <button onClick={() => setShowBrandsModal(false)} className="text-gray-400 hover:text-white transition-colors">
                        <XCircle className="w-6 h-6" />
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left border-b border-white/10">
                            <th className="p-4 text-gray-400 font-medium">Username</th>
                            <th className="p-4 text-gray-400 font-medium">Password</th>
                            <th className="p-4 text-gray-400 font-medium">Created At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {credentials.filter(cred => cred.user_type === 'brand').map(cred => (
                            <tr key={cred.username} className="border-b border-white/10">
                              <td className="p-4 text-white">{cred.username}</td>
                              <td className="p-4 text-white">{cred.password}</td>
                              <td className="p-4 text-white">{new Date(cred.created_at).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-neon-green/20">
              <h3 className="text-xl font-semibold text-white mb-6">Student Signups Over Time</h3>
              {insightsData.signups.length > 0 ? (
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={insightsData.signups}>
                      <XAxis
                        dataKey="date"
                        stroke="#9ca3af"
                        tick={{ fill: '#9ca3af' }}
                      />
                      <YAxis
                        stroke="#9ca3af"
                        tick={{ fill: '#9ca3af' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#000',
                          border: '1px solid rgba(74, 222, 128, 0.2)',
                          borderRadius: '0.5rem'
                        }}
                        labelStyle={{ color: '#fff' }}
                        itemStyle={{ color: '#6366f1' }}
                      />
                      <Bar
                        dataKey="count"
                        fill="#6366f1"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-gray-400 text-center">No signup data available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
          