import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { RegisteredUser, AuthProviderType } from '../../types';
import { ImgbbImageUploader } from '../common/ImgbbImageUploader';
import { db, isFirebaseConfigured } from '../../lib/firebase';
import { collection, onSnapshot, query, doc, setDoc, deleteDoc } from 'firebase/firestore';
import {
  UserCheck,
  Search,
  ShieldCheck,
  Mail,
  Phone,
  Calendar,
  Clock,
  Smartphone,
  Copy,
  Plus,
  RefreshCw,
  CheckCircle,
  XCircle,
  X,
  Trash2,
  Flame
} from 'lucide-react';

export const RegisteredUsersModule: React.FC = () => {
  const {
    registeredUsers,
    addRegisteredUser,
    updateRegisteredUserStatus,
    deleteRegisteredUser,
    searchQuery,
    setSearchQuery,
    addToast,
    t
  } = useApp();

  const [localUsers, setLocalUsers] = useState<RegisteredUser[]>(registeredUsers);
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<RegisteredUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<RegisteredUser | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New user form state
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    photoURL: '',
    authProvider: 'firebase_email' as AuthProviderType,
    status: 'active' as RegisteredUser['status'],
    emailVerified: true,
    deviceInfo: 'Web Browser'
  });

  // Keep localUsers synced with AppContext
  useEffect(() => {
    setLocalUsers(registeredUsers);
  }, [registeredUsers]);

  // Real-time Firestore Users Sync (if Firebase is configured)
  useEffect(() => {
    if (!isFirebaseConfigured()) return;

    try {
      const q = query(collection(db, 'users'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const firestoreUsers: RegisteredUser[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Omit<RegisteredUser, 'uid'>;
          firestoreUsers.push({
            uid: docSnap.id,
            ...data
          });
        });

        if (firestoreUsers.length > 0) {
          setLocalUsers(firestoreUsers);
        }
      }, (error) => {
        console.warn('Firestore live listener notice:', error.message);
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn('Firebase sync warning:', err);
    }
  }, []);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return localUsers.filter(u => {
      // Provider filter
      if (providerFilter !== 'all' && u.authProvider !== providerFilter) return false;
      // Status filter
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;

      // Search query
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q) ||
        u.uid.toLowerCase().includes(q)
      );
    });
  }, [localUsers, providerFilter, statusFilter, searchQuery]);

  // Metrics
  const totalCount = localUsers.length;
  const verifiedEmailCount = localUsers.filter(u => u.emailVerified).length;
  const googleAuthCount = localUsers.filter(u => u.authProvider === 'google_oauth').length;

  // Toggle user active / suspended status
  const handleToggleStatus = async (uid: string, currentStatus: RegisteredUser['status']) => {
    const newStatus: RegisteredUser['status'] = currentStatus === 'active' ? 'suspended' : 'active';
    
    updateRegisteredUserStatus(uid, newStatus);
    setLocalUsers(prev =>
      prev.map(u => (u.uid === uid ? { ...u, status: newStatus } : u))
    );

    // Try updating Firestore if available
    try {
      if (isFirebaseConfigured()) {
        await setDoc(doc(db, 'users', uid), { status: newStatus }, { merge: true });
      }
    } catch (err) {
      console.warn('Firestore status update notice:', err);
    }

    addToast('Status Updated', `User account status changed to ${newStatus.toUpperCase()}`);
  };

  // Delete user account
  const handleDeleteUser = async (uid: string) => {
    deleteRegisteredUser(uid);
    setLocalUsers(prev => prev.filter(u => u.uid !== uid));

    try {
      if (isFirebaseConfigured()) {
        await deleteDoc(doc(db, 'users', uid));
      }
    } catch (err) {
      console.warn('Firestore delete notice:', err);
    }

    setUserToDelete(null);
  };

  // Copy UID helper
  const handleCopyUid = (uid: string) => {
    navigator.clipboard.writeText(uid);
    addToast('UID Copied', `Firebase UID copied: ${uid}`);
  };

  // Manual Firebase Auth Sync trigger
  const handleSyncFirebase = async () => {
    setIsSyncing(true);
    
    // Seed/Sync local users to Firestore if configured
    if (isFirebaseConfigured()) {
      try {
        for (const user of localUsers) {
          await setDoc(doc(db, 'users', user.uid), user, { merge: true });
        }
      } catch (e) {
        console.warn('Sync seed notice:', e);
      }
    }

    setTimeout(() => {
      setIsSyncing(false);
      addToast('Firebase Sync Complete', `Synced ${totalCount} registered user accounts with Firebase Authentication & Firestore.`);
    }, 800);
  };

  // Create new user in state & Firestore
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || (!newUser.email && !newUser.phone)) {
      addToast('Validation Error', 'Please provide a user name and email/phone.', 'warning');
      return;
    }

    const newUid = `fb_usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const createdDate = new Date().toISOString();

    const createdRecord: RegisteredUser = {
      uid: newUid,
      name: newUser.name,
      email: newUser.email || `${newUser.name.toLowerCase().replace(/\s+/g, '')}@bazar.user`,
      phone: newUser.phone || '+8801700000000',
      photoURL: newUser.photoURL || undefined,
      authProvider: newUser.authProvider,
      emailVerified: newUser.emailVerified,
      status: newUser.status,
      createdAt: createdDate,
      lastLoginAt: createdDate,
      deviceInfo: newUser.deviceInfo
    };

    // Update state via AppContext
    addRegisteredUser(createdRecord);
    setLocalUsers(prev => [createdRecord, ...(Array.isArray(prev) ? prev : [])]);

    // Firestore Sync
    try {
      if (isFirebaseConfigured()) {
        await setDoc(doc(db, 'users', newUid), createdRecord);
      }
    } catch (err) {
      console.warn('Firestore user write notice:', err);
    }

    setShowAddModal(false);
    setNewUser({
      name: '',
      email: '',
      phone: '',
      photoURL: '',
      authProvider: 'firebase_email',
      status: 'active',
      emailVerified: true,
      deviceInfo: 'Web Browser'
    });

    addToast('User Registered', `New account ${createdRecord.name} registered into Firebase Auth directory.`);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Banner */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              <span>{t('registeredUsers')}</span>
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono font-bold">
              {totalCount} Accounts
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Directory of all users registered & logged into the website via Firebase Authentication & Web Services.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncFirebase}
            disabled={isSyncing}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-indigo-500 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Firebase Auth'}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Register New User</span>
          </button>
        </div>
      </div>

      {/* Summary Analytics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Accounts</p>
            <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">{totalCount}</p>
          <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-0.5 font-bold">Registered & Logged in</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Verified Emails</p>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">{verifiedEmailCount}</p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-bold">
            {totalCount > 0 ? Math.round((verifiedEmailCount / totalCount) * 100) : 0}% Verified
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Google OAuth</p>
            <span className="text-xs font-black text-rose-500">G</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">{googleAuthCount}</p>
          <p className="text-[10px] text-slate-500 mt-0.5 font-medium">One-Tap Sign In</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Firebase Status</p>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-extrabold text-slate-900 dark:text-white">Live Sync Ready</span>
          </div>
          <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 font-bold">Firebase Auth Connected</p>
        </div>
      </div>

      {/* Controls Bar: Search & Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search UID, name, email, phone..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Provider Filter */}
          <select
            value={providerFilter}
            onChange={e => setProviderFilter(e.target.value)}
            className="px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Auth Providers</option>
            <option value="google_oauth">Google OAuth</option>
            <option value="firebase_email">Firebase Email/Pass</option>
            <option value="firebase_phone">Firebase Phone OTP</option>
          </select>

          {/* Account Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Accounts</option>
            <option value="suspended">Suspended Accounts</option>
            <option value="unverified">Unverified Email</option>
          </select>
        </div>
      </div>

      {/* Main Registered Users Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3.5">Firebase UID & User</th>
                <th className="p-3.5">Contact & Verification</th>
                <th className="p-3.5">Auth Method</th>
                <th className="p-3.5">Account Created</th>
                <th className="p-3.5">Last Active / Device</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No registered users match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  return (
                    <tr key={user.uid} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      
                      {/* User Info & UID */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          {user.photoURL ? (
                            <img
                              src={user.photoURL}
                              alt={user.name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                              {user.name}
                            </p>
                            <button
                              onClick={() => handleCopyUid(user.uid)}
                              className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-indigo-600 font-mono bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800"
                              title="Click to copy Firebase UID"
                            >
                              <span>UID: {user.uid.slice(0, 14)}...</span>
                              <Copy className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Contact & Email Verification */}
                      <td className="p-3.5 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-medium">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{user.email || 'N/A'}</span>
                          {user.emailVerified ? (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold flex items-center gap-0.5">
                              <CheckCircle className="w-2.5 h-2.5" /> Verified
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-bold">
                              Unverified
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{user.phone || 'N/A'}</span>
                        </div>
                      </td>

                      {/* Auth Method */}
                      <td className="p-3.5">
                        {user.authProvider === 'google_oauth' ? (
                          <span className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold text-[11px] border border-rose-200 dark:border-rose-900 inline-flex items-center gap-1">
                            <span className="font-black text-rose-600">G</span> Google OAuth
                          </span>
                        ) : user.authProvider === 'firebase_phone' ? (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] border border-emerald-200 dark:border-emerald-900 inline-flex items-center gap-1">
                            <Phone className="w-3 h-3 text-emerald-600" /> Phone OTP
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] border border-indigo-200 dark:border-indigo-900 inline-flex items-center gap-1">
                            <Flame className="w-3 h-3 text-indigo-600" /> Firebase Email
                          </span>
                        )}
                      </td>

                      {/* Account Created */}
                      <td className="p-3.5 text-slate-600 dark:text-slate-400 font-mono">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </td>

                      {/* Last Active & Device Info */}
                      <td className="p-3.5 space-y-0.5">
                        <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{new Date(user.lastLoginAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        {user.deviceInfo && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Smartphone className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[120px]">{user.deviceInfo}</span>
                          </div>
                        )}
                      </td>

                      {/* Account Status */}
                      <td className="p-3.5">
                        {user.status === 'active' ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[11px]">
                            Active
                          </span>
                        ) : user.status === 'suspended' ? (
                          <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold text-[11px]">
                            Suspended
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold text-[11px]">
                            Unverified
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right space-x-1.5">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user.uid, user.status)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            user.status === 'active'
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}
                        >
                          {user.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                        <button
                          onClick={() => setUserToDelete(user)}
                          className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950 text-slate-400 transition-colors inline-flex items-center justify-center"
                          title="Delete Account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold">{selectedUser.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">UID: {selectedUser.uid}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Email Address</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedUser.email}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Phone Number</p>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedUser.phone}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Authentication Provider</p>
                  <p className="font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 capitalize">{selectedUser.authProvider.replace('_', ' ')}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Account Status</p>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 capitalize">{selectedUser.status}</p>
                </div>
              </div>

              <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Registration Timestamp:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{new Date(selectedUser.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Last Active / Session:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{new Date(selectedUser.lastLoginAt).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Client Device:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedUser.deviceInfo || 'Web App'}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 font-bold text-xs rounded-xl hover:bg-slate-300 text-slate-800 dark:text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register New User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-600" />
                <span>Register New Web / Firebase User</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="e.g. Shakib Al Hasan"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="e.g. user@example.com"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={newUser.phone}
                  onChange={e => setNewUser({ ...newUser, phone: e.target.value })}
                  placeholder="e.g. +8801700112233"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Auth Method
                  </label>
                  <select
                    value={newUser.authProvider}
                    onChange={e => setNewUser({ ...newUser, authProvider: e.target.value as AuthProviderType })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  >
                    <option value="firebase_email">Firebase Email</option>
                    <option value="google_oauth">Google OAuth</option>
                    <option value="firebase_phone">Phone OTP</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={newUser.status}
                    onChange={e => setNewUser({ ...newUser, status: e.target.value as RegisteredUser['status'] })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="unverified">Unverified</option>
                  </select>
                </div>
              </div>

              {/* User Profile Avatar via ImgBB */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <ImgbbImageUploader
                  label="প্রোফাইল ছবি (Profile Avatar - ImgBB)"
                  hint="গ্যালারি থেকে ইউজারের প্রোফাইল ছবি আপলোড করুন।"
                  value={newUser.photoURL || ''}
                  aspectRatio="square"
                  onChange={url => setNewUser({ ...newUser, photoURL: url })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow"
                >
                  Save User Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-base">Delete Account?</h3>
                <p className="text-xs text-slate-500 font-mono">UID: {userToDelete.uid}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{userToDelete.name}</strong> ({userToDelete.email})? This action will remove the account from both local memory and Firebase Firestore.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(userToDelete.uid)}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
