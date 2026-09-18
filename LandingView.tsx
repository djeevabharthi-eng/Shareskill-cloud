import React, { useState } from 'react';
import { 
  ArrowRight, 
  RefreshCw, 
  Users, 
  MessageSquare, 
  ShieldCheck, 
  GraduationCap, 
  Search, 
  Send, 
  Sparkles, 
  ChevronDown 
} from 'lucide-react';

interface LandingViewProps {
  onGetStarted: () => void;
  onOpenAuth: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onGetStarted, onOpenAuth }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const scrollToHowItWorks = () => {
    const el = document.getElementById('how-it-works-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const faqs = [
    {
      q: 'Is ShareSkill Cloud free?',
      a: 'Yes, 100% free. No subscriptions, credits, or hidden fees. We believe everyone has something valuable to teach and something new to learn.'
    },
    {
      q: 'Do I need any credits or tokens?',
      a: 'No tokens or currency required. If someone teaches you Python, you return the favor by teaching them something you know, or paying it forward to the community.'
    },
    {
      q: 'How does matching work?',
      a: 'We match you based on what you teach and what you want to learn. When member A wants to learn what member B teaches, and member B wants to learn what member A teaches, you get a direct reciprocal match.'
    },
    {
      q: 'Is my data safe?',
      a: 'Yes. Your profile details and messaging are secure and your personal contact info is only shared when you choose to connect.'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-16">
      {/* Hero Section */}
      <div className="space-y-6 text-left pt-2">
        {/* Top Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#162035] border border-[#223152] text-[11px] font-medium text-purple-300">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
          Peer-to-peer • Realtime • Cloud-native
        </div>

        {/* Main Title */}
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
          Trade what you know <br />
          for <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-violet-300 to-indigo-300">what you want to learn.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed font-normal">
          ShareSkill Cloud matches you with people whose skills complement yours. Teach Python, learn Photoshop. Teach cooking, learn guitar. No money required.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            id="landing-hero-get-started-btn"
            onClick={onGetStarted}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-purple-900/40 hover:shadow-purple-700/50 transition-all transform active:scale-95 cursor-pointer"
          >
            Get started <ArrowRight className="w-4 h-4" />
          </button>
          <button
            id="landing-hero-how-it-works-btn"
            onClick={scrollToHowItWorks}
            className="px-6 py-3 rounded-xl bg-[#141d33] hover:bg-[#1a2644] text-slate-200 border border-[#243354] font-semibold text-sm transition-colors cursor-pointer"
          >
            How it works
          </button>
        </div>
      </div>

      {/* Built for people who love to teach and learn */}
      <div className="space-y-6 pt-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Built for people who love to teach and learn
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            A calm, focused space to find your next skill partner.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1 */}
          <div className="p-5 rounded-2xl bg-[#11192e]/80 border border-[#1e2c4d] space-y-3 hover:border-purple-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Fair skill barter</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Trade a lesson for a lesson. No credits, no fees — just knowledge for knowledge.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-5 rounded-2xl bg-[#11192e]/80 border border-[#1e2c4d] space-y-3 hover:border-purple-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Smart matching</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              We surface people who want to learn what you teach and vice versa.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-5 rounded-2xl bg-[#11192e]/80 border border-[#1e2c4d] space-y-3 hover:border-purple-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Realtime chat</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Chat instantly once a request is accepted. See who's online right now.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-5 rounded-2xl bg-[#11192e]/80 border border-[#1e2c4d] space-y-3 hover:border-purple-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Verified sign-in</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sign in with email or Google. Your data lives in a secure cloud backend.
            </p>
          </div>
        </div>
      </div>

      {/* How it works Section */}
      <div id="how-it-works-section" className="space-y-6 pt-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            How it works
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Four simple steps from signup to your first exchange.
          </p>
        </div>

        <div className="space-y-3">
          {/* Step 1 */}
          <div className="p-5 rounded-2xl bg-[#11192e]/80 border border-[#1e2c4d] relative overflow-hidden">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">1</div>
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-3">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">List your skills</h3>
            <p className="text-xs text-slate-400 mt-1">
              Add what you can teach and what you'd like to learn.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-5 rounded-2xl bg-[#11192e]/80 border border-[#1e2c4d] relative overflow-hidden">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">2</div>
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-3">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Find a match</h3>
            <p className="text-xs text-slate-400 mt-1">
              Discover people whose skills complement yours.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-5 rounded-2xl bg-[#11192e]/80 border border-[#1e2c4d] relative overflow-hidden">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">3</div>
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-3">
              <Send className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Send a request</h3>
            <p className="text-xs text-slate-400 mt-1">
              Propose an exchange with a short message.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-5 rounded-2xl bg-[#11192e]/80 border border-[#1e2c4d] relative overflow-hidden">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">4</div>
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Learn together</h3>
            <p className="text-xs text-slate-400 mt-1">
              Chat, schedule, and swap knowledge — on your terms.
            </p>
          </div>
        </div>
      </div>

      {/* Questions Section */}
      <div className="space-y-6 pt-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Questions
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-[#11192e]/80 border border-[#1e2c4d] overflow-hidden transition-all"
              >
                <button
                  id={`faq-btn-${idx}`}
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left text-sm font-semibold text-white hover:text-purple-300 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      isOpen ? 'transform rotate-180 text-purple-400' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-[#1a2542] pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Ready to swap your first skill? */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#151f38] to-[#10172b] border border-[#233357] space-y-4">
        <h3 className="text-xl sm:text-2xl font-bold text-white">
          Ready to swap your first skill?
        </h3>
        <p className="text-xs sm:text-sm text-slate-300">
          Create your profile in under a minute. Start matching today.
        </p>
        <div>
          <button
            id="landing-cta-create-account-btn"
            onClick={onOpenAuth}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-md shadow-purple-900/30 cursor-pointer"
          >
            Create free account
          </button>
        </div>
      </div>
    </div>
  );
};
