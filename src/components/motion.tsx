// This is a simplified motion library for basic animations
// A production app would use framer-motion or react-spring

import React, { useState, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type MotionProps = {
  children: ReactNode;
  initial?: Record<string, any>;
  animate?: Record<string, any>;
  transition?: {
    duration?: number;
    delay?: number;
    ease?: string;
  };
  className?: string;
};

export function motion({ 
  children, 
  initial, 
  animate, 
  transition,
  className
}: MotionProps) {
  const [style, setStyle] = useState(initial);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Apply animation after mount to enable transitions
    if (!mounted) {
      setMounted(true);
      return;
    }

    // Minimal simulation of animation library
    const timer = setTimeout(() => {
      setStyle(animate || {});
    }, (transition?.delay || 0) * 1000);

    return () => clearTimeout(timer);
  }, [animate, mounted, transition?.delay]);

  const transitionStyle = {
    transition: `all ${transition?.duration || 0.3}s ${transition?.ease || 'ease-out'}`,
  };

  return (
    <div className={cn(className)} style={{ ...style, ...transitionStyle }}>
      {children}
    </div>
  );
}

motion.div = motion;