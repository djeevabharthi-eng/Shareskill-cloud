import React from 'react';
import { Video, PhoneOff, Check } from 'lucide-react';
import { Avatar } from './Avatar.tsx';

export interface IncomingCallData {
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  skillTopic?: string;
  roomId?: string;
}

interface IncomingCallNotificationProps {
  call: IncomingCallData | null;
  onAccept: (call: IncomingCallData) => void;
  onDecline: () => void;
}

export const IncomingCallNotification: React.FC<IncomingCallNotificationProps> = ({
  call,
  onAccept,
  onDecline,
}) => {
  if (!call) return null;

  return (
    <div className="fixed top-5 right-5 z-50 max-w-md w-full p-4 sm:p-5 rounded-3xl bg-[#0f172a]/95 border-2 border-purple-500/60 shadow-2xl backdrop-blur-xl animate-bounce-short">
      <div className="flex items-center gap-4">
        {/* Caller Avatar with Glowing Pulsing Ring */}
        <div className="relative shrink-0">
          <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 animate-pulse blur-sm opacity-75" />
          <div className="relative">
            <Avatar
              src={call.callerAvatar}
              name={call.callerName}
              size="lg"
              shape="circle"
              className="ring-2 ring-purple-400"
            />
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#0f172a] rounded-full animate-ping" />
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#0f172a] rounded-full" />
          </div>
        </div>

        {/* Call Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-purple-600/30 text-purple-300 border border-purple-500/30">
              Incoming Video Call
            </span>
          </div>
          <h4 className="text-base font-bold text-white truncate mt-1">
            {call.callerName}
          </h4>
          <p className="text-xs text-slate-300 truncate">
            {call.skillTopic || 'Live Skill Exchange Session'}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-[#1e2d4a]">
        <button
          type="button"
          onClick={onDecline}
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 text-xs font-semibold transition-all cursor-pointer"
        >
          <PhoneOff className="w-3.5 h-3.5" />
          <span>Decline</span>
        </button>

        <button
          type="button"
          id="btn-accept-incoming-call"
          onClick={() => onAccept(call)}
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 transition-all cursor-pointer active:scale-95"
        >
          <Video className="w-4 h-4" />
          <span>Accept Call</span>
        </button>
      </div>
    </div>
  );
};
