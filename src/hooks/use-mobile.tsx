
import { useState, useEffect } from 'react';

export function useMobileDetection() {
  const [isMobile, setIsMobile] = useState(() => {
    // Initialize based on initial window size if available
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  const [isTablet, setIsTablet] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768 && window.innerWidth < 1024;
    }
    return false;
  });

  useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth;
      const newIsMobile = width < 768;
      const newIsTablet = width >= 768 && width < 1024;
      
      setIsMobile(newIsMobile);
      setIsTablet(newIsTablet);
    };

    // Check on mount
    checkDeviceType();

    // Add resize listener with debounce for better performance
    let timeoutId: NodeJS.Timeout;
    const debouncedCheck = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkDeviceType, 150);
    };

    window.addEventListener('resize', debouncedCheck);

    // Cleanup
    return () => {
      window.removeEventListener('resize', debouncedCheck);
      clearTimeout(timeoutId);
    };
  }, []);

  return { isMobile, isTablet, isDesktop: !isMobile && !isTablet };
}

// Legacy exports for backward compatibility
export const useIsMobile = () => useMobileDetection().isMobile;
