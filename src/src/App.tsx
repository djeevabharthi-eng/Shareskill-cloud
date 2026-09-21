import React, { useState } from 'react';
import {
  RefreshCw,
  Sun,
  Moon,
  Menu,
  X,
} from 'lucide-react';
import { Avatar } from './Avatar.tsx';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAuth: () => void;
  isLoggedIn: boolean;
  userName?: string;
  avatarUrl?: string;
  onGoHome: () => void;
}

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'discover', label: 'Discover' },
  { id: 'requests', label: 'Requests' },
  { id: 'messages', label: 'Messages' },
  { id: 'progress', label: 'Progress' },
  { id: 'resume', label: 'Resume' },
  { id: 'career', label: 'Career' },
  { id: 'profile', label: 'Profile' },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenAuth,
  isLoggedIn,
  userName,
  avatarUrl,
  onGoHome,
}) => {
  const [isDark, setIsDark] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleTheme = () => {
    setIsDark((previous) => !previous);

    if (isDark) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  const handleAuthClick = () => {
    if (!isLoggedIn) {
      onOpenAuth();
      return;
    }

    onSelectTab('profile');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0b0f19]/90 backdrop-blur-md border-b border-[#1f293d]/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        <div className="flex items-center justify-between h-16">

          {/* LOGO */}

          <button
            id="nav-logo-btn"
            onClick={onGoHome}
            className="flex items-center gap-2.5 group cursor-pointer focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-900/30 group-hover:scale-105 transition-transform">
              <RefreshCw className="w-5 h-5 text-white" />
            </div>

            <div className="flex items-baseline font-bold text-xl tracking-tight">
              <span className="text-white">
                ShareSkill
              </span>

              <span className="text-purple-400 ml-0.5">
                Cloud
              </span>
            </div>
          </button>

          {/* RIGHT SIDE */}

          <div className="flex items-center gap-2.5">

            {/* =================================================
                AUTH / PROFILE BUTTON
            ================================================= */}

            {!isLoggedIn ? (
              <button
                id="header-sign-in-btn"
                type="button"
                onClick={handleAuthClick}
                className="inline-flex text-xs px-3.5 py-1.5 rounded-lg border border-purple-500/40 text-purple-300 hover:bg-purple-950/30 transition-colors font-medium"
              >
                Sign in
              </button>
            ) : (
              <button
                id="header-user-profile-btn"
                type="button"
                onClick={handleAuthClick}
                title={`Profile & Settings (${userName || 'User'})`}
                className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-[#141c30] hover:bg-[#1a2542] border border-[#213054] hover:border-purple-500/50 transition-all cursor-pointer group"
              >
                <Avatar
                  src={avatarUrl}
                  name={userName || 'User'}
                  size="sm"
                  shape="circle"
                  className="ring-1 ring-purple-500/30 group-hover:ring-purple-400/80 transition-all"
                />

                <span className="text-xs font-semibold text-slate-200 group-hover:text-white max-w-[100px] truncate hidden md:inline">
                  {userName || 'Profile'}
                </span>
              </button>
            )}

            {/* =================================================
                THEME BUTTON
            ================================================= */}

            <button
              id="nav-theme-toggle"
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#161f36] border border-transparent hover:border-[#23314f] transition-colors"
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-amber-300" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* =================================================
                MOBILE MENU
            ================================================= */}

            <button
              id="nav-mobile-menu-btn"
              type="button"
              onClick={() =>
                setMobileMenuOpen(
                  (previous) => !previous
                )
              }
              aria-label="Toggle navigation menu"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#161f36] border border-transparent hover:border-[#23314f] transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>

          </div>
        </div>

        {/* =====================================================
            MOBILE MENU
        ===================================================== */}

        {mobileMenuOpen && (
          <div className="sm:hidden py-3 border-t border-[#1f293d] space-y-1">

            <button
              type="button"
              onClick={() => {
                onGoHome();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-[#161f36]"
            >
              Home (Landing)
            </button>

            {/* Only show application navigation when logged in */}

            {isLoggedIn &&
              TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    onSelectTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentTab === tab.id
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                      : 'text-slate-400 hover:bg-[#161f36] hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}

            {/* Sign in from mobile menu */}

            {!isLoggedIn && (
              <button
                type="button"
                onClick={() => {
                  onOpenAuth();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-purple-300 hover:bg-purple-600/10"
              >
                Sign in / Create account
              </button>
            )}

          </div>
        )}

        {/* =====================================================
            DESKTOP SUB NAVIGATION
        ===================================================== */}

        {currentTab !== 'landing' && isLoggedIn && (
          <div className="flex items-center space-x-1.5 overflow-x-auto py-2.5 no-scrollbar scroll-smooth border-t border-[#1a2337]/80">

            {TABS.map((tab) => {
              const active =
                currentTab === tab.id;

              return (
                <button
                  key={tab.id}
                  id={`nav-tab-${tab.id}`}
                  type="button"
                  onClick={() =>
                    onSelectTab(tab.id)
                  }
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                    active
                      ? 'bg-[#1a233a] text-white border border-purple-500/40 shadow-sm shadow-purple-950/50'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#131b2f]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}

          </div>
        )}

      </div>
    </header>
  );
};