import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Search, Filter, Download, RefreshCw, Copy, Check, Key } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface Credential {
  uid: string;
  password: string;
  isAssigned: boolean;
  assignedTo?: string;
  lastUsed?: string;
}

const generateUID = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generatePassword = () => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let password = "";
  for (let i = 0; i < 8; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

const generateCredentials = (count: number): Credential[] => {
  const credentials: Credential[] = [];
  const usedUIDs = new Set();

  for (let i = 0; i < count; i++) {
    let uid;
    do {
      uid = generateUID();
    } while (usedUIDs.has(uid));
    
    usedUIDs.add(uid);
    credentials.push({
      uid,
      password: generatePassword(),
      isAssigned: false
    });
  }

  return credentials;
};

const UIDPasswords = () => {
  const [credentials] = useState<Credential[]>(() => generateCredentials(30));
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [copiedItem, setCopiedItem] = useState<{id: string, type: 'uid' | 'password'} | null>(null);

  const handleCopy = async (text: string, uid: string, type: 'uid' | 'password') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem({ id: uid, type });
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleExportData = () => {
    const csvData = credentials.map(cred => ({
      UID: cred.uid,
      Password: cred.password,
      Status: cred.isAssigned ? 'Assigned' : 'Available',
      'Assigned To': cred.assignedTo || '',
      'Last Used': cred.lastUsed || ''
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `university-credentials-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredCredentials = credentials.filter(cred => {
    const matchesSearch = 
      cred.uid.includes(searchTerm) || 
      (cred.assignedTo?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'assigned' && cred.isAssigned) || 
      (statusFilter === 'available' && !cred.isAssigned);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-neon-green/20 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white mb-2">University Credentials</h2>
          <p className="text-gray-400">Manage and track university login credentials</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setShowPasswords({})}
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
            onClick={handleExportData}
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
            placeholder="Search by UID or assigned university..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none"
        >
          <option value="all" className="bg-black">All Status</option>
          <option value="assigned" className="bg-black">Assigned</option>
          <option value="available" className="bg-black">Available</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-white/10">
              <th className="p-4 text-gray-400 font-medium">UID</th>
              <th className="p-4 text-gray-400 font-medium">Password</th>
              <th className="p-4 text-gray-400 font-medium">Status</th>
              <th className="p-4 text-gray-400 font-medium">Assigned To</th>
              <th className="p-4 text-gray-400 font-medium">Last Used</th>
              <th className="p-4 text-gray-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCredentials.map((cred) => (
              <tr key={cred.uid} className="border-b border-white/10">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono">{cred.uid}</span>
                    <button
                      onClick={() => handleCopy(cred.uid, cred.uid, 'uid')}
                      className="p-1 text-gray-400 hover:text-white transition-colors"
                      title="Copy UID"
                    >
                      {copiedItem?.id === cred.uid && copiedItem?.type === 'uid' ? (
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
                      {showPasswords[cred.uid] ? cred.password : '••••••••'}
                    </span>
                    <button
                      onClick={() => setShowPasswords(prev => ({
                        ...prev,
                        [cred.uid]: !prev[cred.uid]
                      }))}
                      className="p-1 text-gray-400 hover:text-white transition-colors"
                      title={showPasswords[cred.uid] ? "Hide Password" : "Show Password"}
                    >
                      {showPasswords[cred.uid] ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleCopy(cred.password, cred.uid, 'password')}
                      className="p-1 text-gray-400 hover:text-white transition-colors"
                      title="Copy Password"
                    >
                      {copiedItem?.id === cred.uid && copiedItem?.type === 'password' ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    cred.isAssigned 
                      ? 'bg-green-500/20 text-green-500' 
                      : 'bg-blue-500/20 text-blue-500'
                  }`}>
                    {cred.isAssigned ? 'Assigned' : 'Available'}
                  </span>
                </td>
                <td className="p-4 text-gray-400">
                  {cred.assignedTo || '-'}
                </td>
                <td className="p-4 text-gray-400">
                  {cred.lastUsed || 'Never'}
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
  );
};

export default UIDPasswords;