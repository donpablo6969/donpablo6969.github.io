import React from 'react';

interface LogoMarkProps {
  size?: number;
}

export const LogoMark: React.FC<LogoMarkProps> = ({ size = 40 }) => {
  return (
    <img
      src="/assets/aistudio/8ec91335-cd7f-479e-ba84-1a3e4e825de2_28f32334.png"
      alt="Logo DON PABLO HS GROUP"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="rounded-full object-cover border-2 border-[#C59656] dark:border-[#E5B874] shadow-xs shrink-0 bg-[#140D09]"
    />
  );
};
