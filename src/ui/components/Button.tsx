import React from 'react';
type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
};
export default function Button({ variant = 'primary', className = '', ...rest }: Props) {
  const base = 'rounded-figma px-4 py-3 text-[16px] leading-[20px] font-semibold';
  const variants = {
    primary: 'bg-button text-buttonText',
    secondary: 'bg-secondary text-text',
    ghost: 'bg-transparent text-link'
  } as const;
  return <button className={`${base} ${variants[variant]} shadow-figma ${className}`} {...rest} />;
}
