import { supabase } from '../lib/supabase';
import { createId } from '../lib/createId';

const USER_ID_KEY = 'wizzleflow-analytics-user-id';

function getOrCreateUserId(): string {
  if (typeof window === 'undefined') return 'unknown';
  
  let userId = window.localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = createId('user');
    window.localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
}

export const analyticsService = {
  async logEvent(eventType: string) {
    try {
      const userIdentifier = getOrCreateUserId();
      // Fire and forget, we don't want to block the UI for analytics
      supabase.from('usage_events').insert([
        { event_type: eventType, user_identifier: userIdentifier }
      ]).then(({ error }) => {
        if (error) console.error('Failed to log analytics event:', error);
      });
    } catch (err) {
      console.error('Analytics error:', err);
    }
  }
};
