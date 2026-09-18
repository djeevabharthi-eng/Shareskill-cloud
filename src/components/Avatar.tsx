import React, { useState } from 'react';
import { User } from 'lucide-react';

export interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  shape?: 'circle' | 'rounded';
  className?: string;
  showOnlineIndicator?: boolean;
  online?: boolean;
  alt?: string;
  onClick?: () => void;
}

const sizeClasses: Record<string, { container: string; text: string; icon: string; dot: string }> = {
  xs: { container: 'w-6 h-6', text: 'text-[10px]', icon: 'w-3 h-3', dot: 'w-1.5 h-1.5 ring-1' },
  sm: { container: 'w-8 h-8', text: 'text-xs', icon: 'w-4 h-4', dot: 'w-2 h-2 ring-1' },
  md: { container: 'w-10 h-10', text: 'text-sm', icon: 'w-5 h-5', dot: 'w-2.5 h-2.5 ring-2' },
  lg: { container: 'w-12 h-12', text: 'text-base font-semibold', icon: 'w-6 h-6', dot: 'w-3 h-3 ring-2' },
  xl: { container: 'w-16 h-16', text: 'text-xl font-bold', icon: 'w-8 h-8', dot: 'w-3.5 h-3.5 ring-2' },
  '2xl': { container: 'w-24 h-24', text: 'text-3xl font-extrabold', icon: 'w-12 h-12', dot: 'w-4 h-4 ring-2' },
  '3xl': { container: 'w-32 h-32', text: 'text-4xl font-extrabold', icon: 'w-16 h-16', dot: 'w-5 h-5 ring-2' },
};

// Gradient palettes for users without a custom image based on name
const getGradientByName = (name: string = ''): string => {
  const gradients = [
    'from-purple-600 via-indigo-600 to-indigo-700',
    'from-indigo-600 via-purple-600 to-pink-600',
    'from-violet-600 via-purple-700 to-indigo-800',
    'from-blue-600 via-indigo-600 to-purple-600',
    'from-fuchsia-600 via-purple-600 to-indigo-700',
  ];
  if (!name) return gradients[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name = '',
  size = 'md',
  shape = 'circle',
  className = '',
  showOnlineIndicator = false,
  online = true,
  alt,
  onClick,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Reset error when src changes
  React.useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [src]);

  const sizeConfig = sizeClasses[size] || sizeClasses.md;
  const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-2xl';

  const initial = name.trim() ? name.trim().charAt(0).toUpperCase() : '';
  const gradientClass = getGradientByName(name);
  const hasValidImage = Boolean(src && !imageError);

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex shrink-0 select-none ${sizeConfig.container} ${shapeClass} ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {hasValidImage ? (
        <div className={`w-full h-full overflow-hidden ${shapeClass} bg-[#141d33] ring-1 ring-white/10 shadow-sm`}>
          <img
            src={src!}
            alt={alt || name || 'Profile picture'}
            className={`w-full h-full object-cover transition-opacity duration-200 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
          {!imageLoaded && (
            <div className={`w-full h-full flex items-center justify-center bg-[#141d33] text-slate-500 animate-pulse`}>
              <User className={sizeConfig.icon} />
            </div>
          )}
        </div>
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center font-bold text-white shadow-sm bg-gradient-to-tr ${gradientClass} ${shapeClass} ring-1 ring-white/10`}
          title={name}
        >
          {initial ? (
            <span className={sizeConfig.text}>{initial}</span>
          ) : (
            <User className={`${sizeConfig.icon} text-white/80`} />
          )}
        </div>
      )}

      {/* Online indicator */}
      {showOnlineIndicator && (
        <span
          className={`absolute bottom-0 right-0 ${sizeConfig.dot} rounded-full ring-[#0b0f19] ${
            online ? 'bg-emerald-400' : 'bg-slate-500'
          }`}
          title={online ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
};
