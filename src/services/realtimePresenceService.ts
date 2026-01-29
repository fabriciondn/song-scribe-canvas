import { supabase } from "@/integrations/supabase/client";

export interface VisitorPresence {
  visitorId: string;
  currentPage: string;
  enteredAt: string;
  city?: string;
  region?: string;
  country?: string;
  isAuthenticated: boolean;
  userId?: string;
}

// Generate a unique visitor ID for anonymous users
const getVisitorId = (): string => {
  let visitorId = sessionStorage.getItem('visitor_id');
  if (!visitorId) {
    visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('visitor_id', visitorId);
  }
  return visitorId;
};

// Fetch geolocation from IP (using free APIs with HTTPS support)
export const getGeoLocation = async (): Promise<{ city?: string; region?: string; country?: string }> => {
  try {
    // Using ipapi.co (free, HTTPS, no key required for limited requests)
    const response = await fetch('https://ipapi.co/json/');
    if (!response.ok) return {};
    
    const data = await response.json();
    return {
      city: data.city,
      region: data.region,
      country: data.country_name
    };
  } catch (error) {
    console.error('Failed to get geolocation:', error);
    // Fallback to ipinfo.io
    try {
      const fallbackResponse = await fetch('https://ipinfo.io/json');
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        return {
          city: fallbackData.city,
          region: fallbackData.region,
          country: fallbackData.country
        };
      }
    } catch {
      // ignore fallback error
    }
    return {};
  }
};

let presenceChannel: ReturnType<typeof supabase.channel> | null = null;
let geoData: { city?: string; region?: string; country?: string } = {};

export const initializePresence = async (currentPage: string, userId?: string) => {
  // Get geolocation once
  if (!geoData.city) {
    geoData = await getGeoLocation();
  }

  const visitorId = getVisitorId();
  
  // Clean up existing channel
  if (presenceChannel) {
    await supabase.removeChannel(presenceChannel);
  }

  presenceChannel = supabase.channel('online_visitors', {
    config: {
      presence: {
        key: visitorId,
      },
    },
  });

  presenceChannel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      const presenceData: VisitorPresence = {
        visitorId,
        currentPage,
        enteredAt: new Date().toISOString(),
        city: geoData.city,
        region: geoData.region,
        country: geoData.country,
        isAuthenticated: !!userId,
        userId,
      };
      
      await presenceChannel?.track(presenceData);
    }
  });

  return presenceChannel;
};

export const updatePresencePage = async (currentPage: string, userId?: string) => {
  if (!presenceChannel) {
    return initializePresence(currentPage, userId);
  }

  const visitorId = getVisitorId();
  
  const presenceData: VisitorPresence = {
    visitorId,
    currentPage,
    enteredAt: new Date().toISOString(),
    city: geoData.city,
    region: geoData.region,
    country: geoData.country,
    isAuthenticated: !!userId,
    userId,
  };

  await presenceChannel.track(presenceData);
};

export const cleanupPresence = async () => {
  if (presenceChannel) {
    await supabase.removeChannel(presenceChannel);
    presenceChannel = null;
  }
};

// For admin: subscribe to all online visitors
export const subscribeToOnlineVisitors = (
  onSync: (visitors: VisitorPresence[]) => void,
  onJoin?: (key: string, newPresences: VisitorPresence[]) => void,
  onLeave?: (key: string, leftPresences: VisitorPresence[]) => void
) => {
  const channel = supabase.channel('online_visitors');

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<VisitorPresence>();
      const visitors: VisitorPresence[] = [];
      
      Object.values(state).forEach((presences) => {
        presences.forEach((presence) => {
          visitors.push(presence);
        });
      });
      
      onSync(visitors);
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      if (onJoin) {
        onJoin(key, newPresences as unknown as VisitorPresence[]);
      }
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      if (onLeave) {
        onLeave(key, leftPresences as unknown as VisitorPresence[]);
      }
    })
    .subscribe();

  return channel;
};
