import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Users, 
  Copy, 
  Check, 
  AlertCircle,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import type { WebRTCSignal } from '../types.ts';

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerName: string;
  partnerId: string;
  currentUserId: string;
}

export const VideoCallModal: React.FC<VideoCallModalProps> = ({
  isOpen,
  onClose,
  partnerName,
  partnerId,
  currentUserId
}) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(false);
  const [callStatus, setCallStatus] = useState<'initializing' | 'waiting' | 'connected' | 'ended' | 'error'>('initializing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const pollIntervalRef = useRef<any>(null);
  const signalIndexRef = useRef<number>(0);

  // Deterministic room ID between the two users
  const roomId = [currentUserId, partnerId].sort().join('-room-');
  const isInitiator = currentUserId < partnerId;

  useEffect(() => {
    if (!isOpen) {
      cleanup();
      return;
    }

    startCall();

    return () => {
      cleanup();
    };
  }, [isOpen]);

  const cleanup = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop());
      setRemoteStream(null);
    }
    signalIndexRef.current = 0;
  };

  const startCall = async () => {
    setCallStatus('initializing');
    setErrorMessage(null);

    try {
      // 1. Request real media permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // 2. Initialize RTCPeerConnection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });
      pcRef.current = pc;

      // Add local tracks to peer connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle remote track
      const remote = new MediaStream();
      setRemoteStream(remote);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remote;
      }

      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          remote.addTrack(track);
        });
        setCallStatus('connected');
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal({
            type: 'ice-candidate',
            senderId: currentUserId,
            targetId: partnerId,
            candidate: event.candidate
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          setCallStatus('connected');
        } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          setCallStatus('waiting');
        }
      };

      // 3. Negotiate connection
      if (isInitiator) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await sendSignal({
          type: 'offer',
          senderId: currentUserId,
          targetId: partnerId,
          sdp: offer
        });
        setCallStatus('waiting');
      } else {
        setCallStatus('waiting');
      }

      // 4. Start polling for remote signals
      startSignalPolling(pc);
    } catch (err: any) {
      console.error('WebRTC Start Error:', err);
      setCallStatus('error');
      setErrorMessage(
        err.name === 'NotAllowedError'
          ? 'Camera or microphone access was denied. Please allow permissions in your browser to start the video call.'
          : err.message || 'Unable to access camera and microphone.'
      );
    }
  };

  const sendSignal = async (signal: WebRTCSignal) => {
    try {
      await fetch(`/api/webrtc/${roomId}/signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signal)
      });
    } catch (err) {
      console.error('Failed to send signal:', err);
    }
  };

  const startSignalPolling = (pc: RTCPeerConnection) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/webrtc/${roomId}/signals?since=${signalIndexRef.current}`);
        if (!res.ok) return;
        const newSignals: WebRTCSignal[] = await res.json();

        for (const sig of newSignals) {
          signalIndexRef.current += 1;
          if (sig.senderId === currentUserId) continue; // Ignore own signals

          if (sig.type === 'offer' && !isInitiator) {
            await pc.setRemoteDescription(new RTCSessionDescription(sig.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await sendSignal({
              type: 'answer',
              senderId: currentUserId,
              targetId: partnerId,
              sdp: answer
            });
          } else if (sig.type === 'answer' && isInitiator) {
            if (pc.signalingState !== 'stable') {
              await pc.setRemoteDescription(new RTCSessionDescription(sig.sdp));
            }
          } else if (sig.type === 'ice-candidate' && sig.candidate) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(sig.candidate));
            } catch (e) {
              console.warn('Error adding ICE candidate', e);
            }
          } else if (sig.type === 'call-ended') {
            setCallStatus('ended');
          }
        }
      } catch (err) {
        console.error('Signal polling error:', err);
      }
    }, 1500);
  };

  const toggleMute = () => {
    if (!localStream) return;
    const next = !isAudioMuted;
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = !next;
    });
    setIsAudioMuted(next);
  };

  const toggleVideo = () => {
    if (!localStream) return;
    const next = !isVideoDisabled;
    localStream.getVideoTracks().forEach((track) => {
      track.enabled = !next;
    });
    setIsVideoDisabled(next);
  };

  const handleEndCall = () => {
    sendSignal({
      type: 'call-ended',
      senderId: currentUserId,
      targetId: partnerId
    });
    cleanup();
    setCallStatus('ended');
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl rounded-3xl bg-[#0b0f19] border border-[#223152] overflow-hidden flex flex-col shadow-2xl">
        {/* Call Header */}
        <div className="px-5 py-3.5 bg-[#10172b] border-b border-[#1b2744] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-none">
                Exchange with {partnerName}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                {callStatus === 'connected' && (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Call Active (WebRTC Live)
                  </span>
                )}
                {callStatus === 'waiting' && (
                  <span className="text-amber-300">Waiting for peer connection...</span>
                )}
                {callStatus === 'initializing' && 'Accessing camera & microphone...'}
                {callStatus === 'ended' && 'Call ended'}
                {callStatus === 'error' && 'Device access error'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyRoomCode}
              title="Copy room ID to test 2-way call in another browser tab"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#16213c] hover:bg-[#1d2c50] text-[11px] text-slate-300 border border-[#23355d] transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-purple-400" />}
              <span>{copiedLink ? 'Copied Room ID' : 'Room ID'}</span>
            </button>
          </div>
        </div>

        {/* Video Stage */}
        <div className="relative w-full aspect-video bg-[#070b13] flex items-center justify-center overflow-hidden">
          {/* Error State */}
          {callStatus === 'error' && (
            <div className="p-6 text-center max-w-md space-y-3">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
              <h4 className="text-sm font-bold text-white">Camera or Microphone Error</h4>
              <p className="text-xs text-slate-400">{errorMessage}</p>
              <button
                onClick={startCall}
                className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-500"
              >
                Retry Camera Access
              </button>
            </div>
          )}

          {/* Remote Video Stream */}
          {callStatus !== 'error' && (
            <>
              {remoteStream && remoteStream.getVideoTracks().length > 0 ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center space-y-3 p-6">
                  <div className="w-16 h-16 rounded-full bg-purple-900/30 border border-purple-600/40 flex items-center justify-center mx-auto text-purple-300 text-xl font-bold">
                    {partnerName.charAt(0)}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white">
                      Waiting for {partnerName} to join room...
                    </p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Your camera and microphone are active. When {partnerName} accepts or joins this room, their video will stream here.
                    </p>
                  </div>
                </div>
              )}

              {/* Local Video Stream Picture-in-Picture (PiP) */}
              <div className="absolute bottom-4 right-4 w-32 sm:w-44 aspect-video rounded-2xl overflow-hidden bg-slate-900 border-2 border-purple-500/50 shadow-2xl">
                {isVideoDisabled ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400 text-xs gap-1">
                    <VideoOff className="w-4 h-4" />
                    <span>Camera off</span>
                  </div>
                ) : (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover -scale-x-100"
                  />
                )}
                <div className="absolute bottom-1 left-2 text-[9px] font-bold text-white drop-shadow-md">
                  You {isAudioMuted && '(Muted)'}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Video Call Controls Toolbar */}
        <div className="px-6 py-4 bg-[#0f1629] border-t border-[#1a2542] flex items-center justify-center gap-4">
          {/* Mute audio button */}
          <button
            onClick={toggleMute}
            aria-label={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
            className={`p-3.5 rounded-2xl transition-all cursor-pointer ${
              isAudioMuted
                ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30'
                : 'bg-[#18243e] hover:bg-[#203054] text-white border border-[#273a67]'
            }`}
          >
            {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Toggle camera button */}
          <button
            onClick={toggleVideo}
            aria-label={isVideoDisabled ? 'Turn camera on' : 'Turn camera off'}
            className={`p-3.5 rounded-2xl transition-all cursor-pointer ${
              isVideoDisabled
                ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30'
                : 'bg-[#18243e] hover:bg-[#203054] text-white border border-[#273a67]'
            }`}
          >
            {isVideoDisabled ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>

          {/* End call button */}
          <button
            onClick={handleEndCall}
            aria-label="End call"
            className="p-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/50 transition-transform active:scale-95 cursor-pointer"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
