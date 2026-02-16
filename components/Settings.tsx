
import React, { useState, useEffect } from 'react';
import { TutorProfile } from '../types';
import { dbService } from '../services/dbService';
import { supabase } from '../services/supabaseClient';
import { useTheme } from '../contexts/ThemeContext';

interface SettingsProps {
    profile: TutorProfile | undefined;
    onProfileUpdate: () => void;
}

const Settings: React.FC<SettingsProps> = ({ profile, onProfileUpdate }) => {
    const { theme, toggleTheme } = useTheme();

    // Profile State
    const [formData, setFormData] = useState<{
        name: string;
        email: string;
        school: string;
        college: string;
        university: string;
        level: string;
        term: string;
        city: string;
        contactNumber: string;
        profession: string;
        avatarUrl: string;
    }>({
        name: '',
        email: '',
        school: '',
        college: '',
        university: '',
        level: '',
        term: '',
        city: '',
        contactNumber: '',
        profession: '',
        avatarUrl: ''
    });
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileMsg, setProfileMsg] = useState('');
    const [uploading, setUploading] = useState(false);

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passLoading, setPassLoading] = useState(false);
    const [passMsg, setPassMsg] = useState('');
    const [passError, setPassError] = useState('');

    useEffect(() => {
        if (profile) {
            setFormData({
                name: profile.name || '',
                email: profile.email || '',
                school: profile.school || '',
                college: profile.college || '',
                university: profile.university || '',
                level: profile.level || '',
                term: profile.term || '',
                city: profile.city || '',
                contactNumber: profile.contactNumber || '',
                profession: profile.profession || '',
                avatarUrl: profile.avatarUrl || ''
            });
        }
    }, [profile]);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileLoading(true);
        setProfileMsg('');
        try {
            // Map form data back to TutorProfile structure
            const updateData: TutorProfile = {
                ...profile!, // Keep existing fields like id if needed (though profile doesn't have id in types)
                name: formData.name,
                email: formData.email,
                school: formData.school,
                college: formData.college,
                university: formData.university,
                level: formData.level,
                term: formData.term,
                city: formData.city,
                contactNumber: formData.contactNumber,
                profession: formData.profession || 'Educator',
                avatarUrl: formData.avatarUrl,
                institution: formData.college || formData.university, // Fallback
                yearTerm: `${formData.level}-${formData.term}` // Derived
            };

            await dbService.updateProfile(updateData);
            setProfileMsg('Profile saved successfully.');
            onProfileUpdate();
        } catch (error) {
            console.error(error);
            setProfileMsg('Failed to update profile.');
        } finally {
            setProfileLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setProfileMsg('');
        try {
            const publicUrl = await dbService.uploadAvatar(file);
            await dbService.updateAvatarUrl(publicUrl);
            setFormData(prev => ({ ...prev, avatarUrl: publicUrl }));

            // Sync with localStorage for Login screen recognition
            if (profile?.email) {
                localStorage.setItem('last_login_avatar', publicUrl);
            }

            setProfileMsg('Photo saved to database successfully!');
            onProfileUpdate();
        } catch (error) {
            console.error("Upload failed:", error);
            setProfileMsg('Failed to upload photo. Ensure you have a storage bucket.');
        } finally {
            setUploading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPassError('');
        setPassMsg('');

        if (newPassword !== confirmPassword) {
            setPassError("New passwords do not match.");
            return;
        }
        if (newPassword.length < 6) {
            setPassError("Password must be at least 6 characters.");
            return;
        }

        setPassLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !user.email) throw new Error("User not identified.");

            // 1. Verify Current Password
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: currentPassword
            });

            if (signInError) {
                throw new Error("Current password is incorrect.");
            }

            // 2. Update to New Password
            const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
            if (updateError) throw updateError;

            setPassMsg('Password updated successfully.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            setPassError(error.message);
        } finally {
            setPassLoading(false);
        }
    };

    // Deletion State
    const [deleteConfirm, setDeleteConfirm] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteAccount = async () => {
        if (deleteConfirm !== 'DELETE') return;

        setIsDeleting(true);
        try {
            await dbService.deleteUserAccount();
            localStorage.clear(); // Wipe everything
            window.location.reload();
        } catch (error) {
            alert("Failed to delete account. Please try again.");
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-5xl mx-auto relative z-0">
            {/* Background - Softer Light Mode */}
            <div className="fixed inset-0 z-[-1] pointer-events-none">
                {/* Light Mode: Soft Gradient, Dark Mode: Deep Space */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-[#020617] dark:via-slate-950 dark:to-blue-950 transition-colors duration-500"></div>

                {/* Subtle Orbs */}
                <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-blue-200/20 dark:bg-blue-500/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-violet-200/20 dark:bg-violet-500/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse delay-700"></div>
            </div>

            <div className="flex items-center justify-between pb-6 border-b border-slate-200/60 dark:border-slate-800">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Settings</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Manage your profile, security, and preferences.</p>
                </div>
            </div>

            {/* 1. Appearance */}
            <section className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl p-8 border border-white/50 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <i className="fas fa-palette text-lg"></i>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Appearance</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Customize your interface theme.</p>
                        </div>
                    </div>

                    <button
                        onClick={toggleTheme}
                        className="group flex items-center gap-3 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer"
                    >
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                            {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                        </span>
                        <div className={`w-10 h-6 rounded-full relative transition-colors duration-300 ${theme === 'dark' ? 'bg-blue-600' : 'bg-slate-300'}`}>
                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0'}`}></div>
                        </div>
                    </button>
                </div>
            </section>

            {/* 2. Public Profile */}
            <section className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl p-8 border border-white/50 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <i className="fas fa-user-circle text-lg"></i>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Public Profile</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Update your educational information.</p>
                    </div>
                </div>

                <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="flex flex-col items-center mb-8">
                        <div className="relative group">
                            <input
                                type="file"
                                id="avatar-upload"
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileUpload}
                                disabled={uploading}
                            />
                            <label
                                htmlFor="avatar-upload"
                                className={`w-36 h-36 rounded-[2.5rem] bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-slate-200 dark:border-slate-700 cursor-pointer transition-all hover:border-blue-500 hover:scale-105 active:scale-95 ${uploading ? 'opacity-50 animate-pulse' : ''}`}
                            >
                                {formData.avatarUrl ? (
                                    <img src={formData.avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <i className="fas fa-cloud-arrow-up text-3xl text-slate-400"></i>
                                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Select From Device</span>
                                    </div>
                                )}
                                {uploading && (
                                    <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                                        <i className="fas fa-spinner fa-spin text-blue-600 text-xl"></i>
                                    </div>
                                )}
                            </label>
                            {!uploading && (
                                <label
                                    htmlFor="avatar-upload"
                                    className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl cursor-pointer hover:bg-blue-700 transition-all border-4 border-white dark:border-[#020617]"
                                >
                                    <i className="fas fa-camera text-sm"></i>
                                </label>
                            )}
                        </div>
                        <div className="w-full max-w-md mt-8 space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center justify-between">
                                <span>Profile Picture URL</span>
                                <span className="text-[8px] italic opacity-60">Upload from device or paste link</span>
                            </label>
                            <input
                                type="text"
                                value={formData.avatarUrl}
                                onChange={e => setFormData({ ...formData, avatarUrl: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400"
                                placeholder="https://example.com/photo.jpg"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        {/* Name */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-400"
                                placeholder="Enter your full name"
                            />
                        </div>

                        {/* Email (Read Only Connection) */}
                        <div className="space-y-2 opacity-80">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-2">
                                <i className="fas fa-lock text-[10px]"></i> Primary Connection Email
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                readOnly
                                className="w-full px-4 py-3 rounded-xl bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold cursor-default outline-none select-none"
                            />
                        </div>

                        {/* Contact Number */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Contact Number</label>
                            <input
                                type="tel"
                                value={formData.contactNumber}
                                onChange={e => setFormData({ ...formData, contactNumber: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-400"
                                placeholder="+880 1XXX-XXXXXX"
                            />
                        </div>

                        {/* School */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">School</label>
                            <input
                                type="text"
                                value={formData.school}
                                onChange={e => setFormData({ ...formData, school: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-400"
                                placeholder="High School Name"
                            />
                        </div>

                        {/* College */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">College</label>
                            <input
                                type="text"
                                value={formData.college}
                                onChange={e => setFormData({ ...formData, college: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-400"
                                placeholder="College Name"
                            />
                        </div>

                        {/* University */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">University</label>
                            <input
                                type="text"
                                value={formData.university}
                                onChange={e => setFormData({ ...formData, university: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-400"
                                placeholder="University Name"
                            />
                        </div>

                        {/* City */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">City</label>
                            <input
                                type="text"
                                value={formData.city}
                                onChange={e => setFormData({ ...formData, city: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-400"
                                placeholder="Current City"
                            />
                        </div>

                        {/* Level & Term Group */}
                        <div className="md:col-span-2 grid grid-cols-2 gap-8">
                            {/* Level */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Level</label>
                                <select
                                    value={formData.level}
                                    onChange={e => setFormData({ ...formData, level: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">Select Level</option>
                                    <option value="1">Level 1</option>
                                    <option value="2">Level 2</option>
                                    <option value="3">Level 3</option>
                                    <option value="4">Level 4</option>
                                </select>
                            </div>

                            {/* Term */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Term</label>
                                <select
                                    value={formData.term}
                                    onChange={e => setFormData({ ...formData, term: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">Select Term</option>
                                    <option value="1">Term 1</option>
                                    <option value="2">Term 2</option>
                                </select>
                            </div>
                        </div>

                    </div>

                    <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        {profileMsg && <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm animate-in fade-in">{profileMsg}</span>}
                        <button
                            type="submit"
                            disabled={profileLoading}
                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm uppercase tracking-wide transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {profileLoading ? 'Saving...' : 'Save Profile'}
                        </button>
                    </div>
                </form>
            </section>

            {/* 3. Change Your Password */}
            <section className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl p-8 border border-white/50 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                        <i className="fas fa-key text-lg"></i>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Change Your Password</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Verify your identity to update credentials.</p>
                    </div>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-6 max-w-xl">
                    {/* Current Password */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Current Password</label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={e => setCurrentPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all placeholder:text-slate-400"
                            placeholder="Enter current password"
                        />
                    </div>

                    {/* New Password */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all placeholder:text-slate-400"
                                placeholder="Min 6 chars"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Confirm New</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all placeholder:text-slate-400"
                                placeholder="Re-enter password"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-start gap-4">
                        <button
                            type="submit"
                            disabled={passLoading}
                            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-bold text-sm uppercase tracking-wide transition-all shadow-md shadow-violet-500/20 disabled:opacity-50"
                        >
                            {passLoading ? 'Verifying & Updating...' : 'Update Password'}
                        </button>
                        {passMsg && <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">{passMsg}</span>}
                        {passError && <span className="text-rose-600 dark:text-rose-400 font-bold text-sm">{passError}</span>}
                    </div>
                </form>
            </section>

            {/* 4. Danger Zone */}
            <section className="bg-rose-50/50 dark:bg-rose-900/10 backdrop-blur-md rounded-2xl p-8 border border-rose-100 dark:border-rose-900/30 transition-all">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h4 className="text-xl font-black text-rose-600 dark:text-rose-500 uppercase tracking-tight">Danger Zone</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-md">
                            Deleting your account will permanently wipe all your students, sessions, payments, and profile data. This action is irreversible.
                        </p>
                    </div>
                    <div className="w-full md:w-auto space-y-3">
                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest text-center md:text-left">Type <span className="text-rose-600">DELETE</span> to confirm</p>
                            <input
                                type="text"
                                placeholder="Type DELETE"
                                className="w-full md:w-48 px-4 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-rose-600 font-black text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none text-center"
                                value={deleteConfirm}
                                onChange={(e) => setDeleteConfirm(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={handleDeleteAccount}
                            disabled={deleteConfirm !== 'DELETE' || isDeleting}
                            className={`w-full px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg ${deleteConfirm === 'DELETE'
                                    ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-500/20'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700 shadow-none'
                                }`}
                        >
                            {isDeleting ? <><i className="fas fa-spinner fa-spin mr-2"></i> Wiping Data...</> : 'Confirm Permanent Deletion'}
                        </button>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default Settings;
