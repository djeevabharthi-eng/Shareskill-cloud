import React from 'react';
import { RefreshCw } from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: string) => void;
  onOpenAuth: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenAuth }) => {
  return (
    <footer className="mt-20 border-t border-[#1a2438] bg-[#090d16] text-slate-400 py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white">
              <RefreshCw className="w-4 h-4 text-white" />
            </div>
            <div className="font-bold text-lg text-white">
              <span>ShareSkill</span>
              <span className="text-purple-400 ml-0.5">Cloud</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
            A peer-to-peer skill exchange platform. Trade what you know for what you want to learn.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Product</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button
                onClick={() => onNavigate('landing')}
                className="hover:text-purple-400 transition-colors"
              >
                Home
              </button>
            </li>
            <li>
              <button
                onClick={onOpenAuth}
                className="hover:text-purple-400 transition-colors"
              >
                Sign in
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('discover')}
                className="hover:text-purple-400 transition-colors"
              >
                Discover
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Cloud</h4>
          <ul className="space-y-2 text-xs">
            <li className="text-slate-400">Realtime chat</li>
            <li className="text-slate-400">Secure auth</li>
            <li className="text-slate-400">Fair skill barter</li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-[#161f33] text-[11px] text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-2">
        <span>© {new Date().getFullYear()} ShareSkill Cloud. All rights reserved.</span>
        <span>Peer-to-peer • Realtime • Cloud-native</span>
      </div>
    </footer>
  );
};
