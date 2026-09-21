import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Trash2,
  Plus,
  CheckCircle2,
  ChevronDown,
  Camera,
  Upload,
  Crop,
  AlertCircle,
  RefreshCw,
  Image as ImageIcon,
  Check,
  X
} from 'lucide-react';
import type { UserProfile, SkillItem } from '../types.ts';
import { Avatar } from './Avatar.tsx';
import { ImageCropModal } from './ImageCropModal.tsx';

interface ProfileViewProps {
  user: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onUpdateProfile }) => {
  const [fullName, setFullName] = useState(user.name || '');
  const [city, setCity] = useState(user.city || '');
  const [country, setCountry] = useState(user.country || '');
  const [bio, setBio] = useState(user.bio || '');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Avatar state
  const [currentAvatar, setCurrentAvatar] = useState(user.avatarUrl || '');
  const [avatarMessage, setAvatarMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  // Image cropping state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawImageForCrop, setRawImageForCrop] = useState<string>('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync avatar and form with user prop updates
  useEffect(() => {
    setCurrentAvatar(user.avatarUrl || '');
    setFullName(user.name || '');
    setCity(user.city || '');
    setCountry(user.country || '');
    setBio(user.bio || '');
  }, [user]);

  // Teach Skill State
  const [teachName, setTeachName] = useState('');
  const [teachCategory, setTeachCategory] = useState('Programming');
  const [teachLevel, setTeachLevel] = useState<'Beginner' | 'Intermediate' | 'Expert'>('Intermediate');
  const [addingTeach, setAddingTeach] = useState(false);

  // Learn Skill State
  const [learnName, setLearnName] = useState('');
  const [learnCategory, setLearnCategory] = useState('Programming');
  const [addingLearn, setAddingLearn] = useState(false);

  // Trigger file selection
  const handleSelectFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Process selected file from input or drop
  const processImageFile = (file: File) => {
    setAvatarMessage(null);

    // Validate type
    if (!file.type.startsWith('image/')) {
      setAvatarMessage({ type: 'error', text: 'Please select an image file (JPG, PNG, WebP, or GIF)' });
      return;
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setAvatarMessage({ type: 'error', text: 'Image file size exceeds 10MB. Please choose a smaller photo.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setRawImageForCrop(dataUrl);
        setCropModalOpen(true);
      }
    };
    reader.onerror = () => {
      setAvatarMessage({ type: 'error', text: 'Failed to read image file. Please try another.' });
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Handle saving cropped profile picture to backend
  const handleCropComplete = async (croppedDataUrl: string) => {
    setIsUploadingAvatar(true);
    setAvatarMessage(null);
    try {
      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData: croppedDataUrl,
          fileName: `dp_${user.id}.jpg`,
          mimeType: 'image/jpeg',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save profile picture');
      }

      setCurrentAvatar(data.avatarUrl);
      onUpdateProfile(data.user);
      setCropModalOpen(false);
      setAvatarMessage({ type: 'success', text: 'Profile display picture updated successfully!' });
      setTimeout(() => setAvatarMessage(null), 3500);
    } catch (err: any) {
      console.error('Avatar save failed:', err);
      setAvatarMessage({ type: 'error', text: err.message || 'Failed to save profile picture' });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Handle removing profile picture (reverts to default initials)
  const handleRemoveAvatar = async () => {
    setIsRemovingAvatar(true);
    setAvatarMessage(null);
    try {
      const res = await fetch('/api/profile/avatar', {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove profile picture');
      }

      setCurrentAvatar('');
      onUpdateProfile(data.user);
      setShowRemoveConfirm(false);
      setAvatarMessage({ type: 'success', text: 'Profile picture removed. Default avatar is now active.' });
      setTimeout(() => setAvatarMessage(null), 3500);
    } catch (err: any) {
      console.error('Avatar removal failed:', err);
      setAvatarMessage({ type: 'error', text: err.message || 'Failed to remove profile picture' });
    } finally {
      setIsRemovingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          city,
          country,
          bio,
          avatarUrl: currentAvatar,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdateProfile(updated);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      }
    } catch (e) {
      console.error('Save profile error:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleAddTeachSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teachName.trim()) return;
    setAddingTeach(true);
    try {
      const res = await fetch('/api/profile/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'teach',
          name: teachName.trim(),
          category: teachCategory,
          level: teachLevel
        })
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdateProfile(updated);
        setTeachName('');
      }
    } catch (e) {
      console.error('Add teach skill error:', e);
    } finally {
      setAddingTeach(false);
    }
  };

  const handleAddLearnSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!learnName.trim()) return;
    setAddingLearn(true);
    try {
      const res = await fetch('/api/profile/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'learn',
          name: learnName.trim(),
          category: learnCategory,
          level: 'Beginner'
        })
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdateProfile(updated);
        setLearnName('');
      }
    } catch (e) {
      console.error('Add learn skill error:', e);
    } finally {
      setAddingLearn(false);
    }
  };

  const handleDeleteSkill = async (id: string) => {
    try {
      const res = await fetch(`/api/profile/skills/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const updated = await res.json();
        onUpdateProfile(updated);
      }
    } catch (e) {
      console.error('Delete skill error:', e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-10">
      {/* Toast */}
      {savedSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-600/50 text-emerald-300 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>Profile saved successfully!</span>
        </div>
      )}

      {/* Heading */}
      <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
        Your profile
      </h1>

      {/* Hidden file input for uploading profile picture */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
      />

      {/* Profile Display Picture (DP) Section */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`p-5 sm:p-7 rounded-3xl bg-[#10172b] border transition-all ${
          isDraggingOver
            ? 'border-purple-500 bg-purple-950/20 shadow-xl shadow-purple-900/30 ring-2 ring-purple-500/50'
            : 'border-[#1e2d4f] shadow-lg'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5 sm:gap-6">
            {/* Display Picture Preview */}
            <div className="relative group shrink-0">
              <Avatar
                src={currentAvatar}
                name={fullName || user.name}
                size="2xl"
                shape="circle"
                className="ring-4 ring-[#1b2744] group-hover:ring-purple-500/60 shadow-xl transition-all"
              />
              <button
                type="button"
                id="btn-trigger-upload-camera"
                onClick={handleSelectFileClick}
                disabled={isUploadingAvatar || isRemovingAvatar}
                title="Upload or change profile picture"
                className="absolute bottom-0 right-0 p-2.5 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-950/60 border-2 border-[#10172b] transition-transform active:scale-90 cursor-pointer disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Profile DP Info & Status */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Profile Display Picture
                </h2>
                {currentAvatar ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-600/40">
                    <Check className="w-3 h-3 text-emerald-400" />
                    Custom Picture Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                    Default Avatar (Initials)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 max-w-md">
                Upload a photo of yourself. Your profile picture will be automatically visible across your profile, dashboard, discover cards, messages, and video calls.
              </p>
              <p className="text-[11px] text-slate-500">
                Supports JPG, PNG, WebP up to 10MB • Drag & drop directly here
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-start sm:justify-end">
            <button
              type="button"
              id="upload-dp-btn"
              onClick={handleSelectFileClick}
              disabled={isUploadingAvatar || isRemovingAvatar}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-purple-950/50 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{currentAvatar ? 'Replace Photo' : 'Upload Photo'}</span>
            </button>

            {currentAvatar && (
              <>
                <button
                  type="button"
                  id="re-crop-dp-btn"
                  onClick={() => {
                    setRawImageForCrop(currentAvatar);
                    setCropModalOpen(true);
                  }}
                  disabled={isUploadingAvatar || isRemovingAvatar}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#18233d] hover:bg-[#202f52] text-slate-200 border border-[#27385f] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  title="Adjust or re-crop current display picture"
                >
                  <Crop className="w-3.5 h-3.5 text-purple-400" />
                  <span>Adjust & Crop</span>
                </button>

                <button
                  type="button"
                  id="remove-dp-btn"
                  onClick={() => setShowRemoveConfirm(true)}
                  disabled={isUploadingAvatar || isRemovingAvatar}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  title="Remove picture and return to default avatar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Message Banner for Avatar operations */}
        {avatarMessage && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs font-medium flex items-center gap-2 animate-fadeIn ${
              avatarMessage.type === 'success'
                ? 'bg-emerald-950/80 border border-emerald-600/50 text-emerald-300'
                : 'bg-rose-950/80 border border-rose-600/50 text-rose-300'
            }`}
          >
            {avatarMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{avatarMessage.text}</span>
          </div>
        )}

        {/* Remove Confirmation Dialog */}
        {showRemoveConfirm && (
          <div className="mt-4 p-4 rounded-2xl bg-[#16203a] border border-rose-600/40 animate-fadeIn space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-rose-950/60 text-rose-400 shrink-0 border border-rose-800/30">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">
                  Remove Profile Picture?
                </h4>
                <p className="text-xs text-slate-300">
                  Are you sure you want to remove your profile display picture? Your profile will revert to the default gradient avatar with your initials ({fullName?.charAt(0) || 'U'}).
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowRemoveConfirm(false)}
                disabled={isRemovingAvatar}
                className="px-3.5 py-1.5 rounded-xl bg-[#1b2644] hover:bg-[#233157] text-slate-300 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-remove-dp-btn"
                onClick={handleRemoveAvatar}
                disabled={isRemovingAvatar}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-950/50 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isRemovingAvatar ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Remove Photo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Image Crop Modal */}
      <ImageCropModal
        isOpen={cropModalOpen}
        imageSrc={rawImageForCrop}
        onClose={() => setCropModalOpen(false)}
        onCropComplete={handleCropComplete}
        isSaving={isUploadingAvatar}
      />

      {/* Main Profile Form (Frames 01:27 - 01:28) */}
      <form onSubmit={handleSaveProfile} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300">Full name</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Jeeva bharathi D"
            className="w-full px-4 py-2.5 rounded-xl bg-[#141d33] border border-[#213052] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300">City</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Thanjavur"
            className="w-full px-4 py-2.5 rounded-xl bg-[#141d33] border border-[#213052] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300">Country</label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="e.g. India"
            className="w-full px-4 py-2.5 rounded-xl bg-[#141d33] border border-[#213052] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300">Bio</label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell others what you're passionate about..."
            className="w-full px-4 py-2.5 rounded-xl bg-[#141d33] border border-[#213052] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          id="profile-save-btn"
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-purple-900/30 transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save profile'}
        </button>
      </form>

      {/* Skills I can teach (Frames 01:29 - 01:30) */}
      <div className="space-y-4 pt-4 border-t border-[#1e2c4d]">
        <h2 className="text-lg sm:text-xl font-bold text-white">
          Skills I can teach
        </h2>

        <form onSubmit={handleAddTeachSkill} className="space-y-3">
          <input
            type="text"
            value={teachName}
            onChange={(e) => setTeachName(e.target.value)}
            placeholder="e.g. Python, Watercolor painting"
            className="w-full px-4 py-2.5 rounded-xl bg-[#141d33] border border-[#213052] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <select
                value={teachCategory}
                onChange={(e) => setTeachCategory(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-[#141d33] border border-[#213052] text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500 appearance-none cursor-pointer"
              >
                <option value="Programming">Programming</option>
                <option value="Design">Design</option>
                <option value="Language">Language</option>
                <option value="Music">Music</option>
                <option value="Other">Other</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={teachLevel}
                onChange={(e) => setTeachLevel(e.target.value as any)}
                className="w-full px-4 py-2 rounded-xl bg-[#141d33] border border-[#213052] text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500 appearance-none cursor-pointer"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Expert">Expert</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={addingTeach || !teachName.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#17223c] hover:bg-[#202f54] text-slate-200 border border-[#23345d] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </form>

        {/* Existing Teach Skills List */}
        <div className="space-y-2 pt-2">
          {user.teachSkills.map((s) => (
            <div
              key={s.id}
              className="p-4 rounded-2xl bg-[#11192e]/90 border border-[#1e2c4d] flex items-center justify-between gap-3"
            >
              <div>
                <h4 className="text-sm font-bold text-white">{s.name}</h4>
                <p className="text-xs text-slate-400">
                  {s.category} • {s.level || 'beginner'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <button
                  onClick={() => handleDeleteSkill(s.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {user.teachSkills.length === 0 && (
            <p className="text-xs text-slate-400">No teaching skills added yet.</p>
          )}
        </div>
      </div>

      {/* Skills I want to learn (Frames 01:30 - 01:31) */}
      <div className="space-y-4 pt-4 border-t border-[#1e2c4d]">
        <h2 className="text-lg sm:text-xl font-bold text-white">
          Skills I want to learn
        </h2>

        <form onSubmit={handleAddLearnSkill} className="space-y-3">
          <input
            type="text"
            value={learnName}
            onChange={(e) => setLearnName(e.target.value)}
            placeholder="e.g. Python, Watercolor painting"
            className="w-full px-4 py-2.5 rounded-xl bg-[#141d33] border border-[#213052] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />

          <div className="relative">
            <select
              value={learnCategory}
              onChange={(e) => setLearnCategory(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-[#141d33] border border-[#213052] text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500 appearance-none cursor-pointer"
            >
              <option value="Programming">Programming</option>
              <option value="Design">Design</option>
              <option value="Language">Language</option>
              <option value="Music">Music</option>
              <option value="Other">Other</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>

          <button
            type="submit"
            disabled={addingLearn || !learnName.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#17223c] hover:bg-[#202f54] text-slate-200 border border-[#23345d] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </form>

        {/* Existing Learn Skills List */}
        <div className="space-y-2 pt-2">
          {user.learnSkills.map((s) => (
            <div
              key={s.id}
              className="p-4 rounded-2xl bg-[#11192e]/90 border border-[#1e2c4d] flex items-center justify-between gap-3"
            >
              <div>
                <h4 className="text-sm font-bold text-white">{s.name}</h4>
                <p className="text-xs text-slate-400">{s.category}</p>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <button
                  onClick={() => handleDeleteSkill(s.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {user.learnSkills.length === 0 && (
            <p className="text-xs text-slate-400">No learning skills added yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};
