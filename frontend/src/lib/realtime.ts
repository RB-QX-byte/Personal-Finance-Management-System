import { supabase } from './supabase';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export interface RealtimeSubscription {
  channel: RealtimeChannel;
  unsubscribe: () => void;
}

export interface TransactionPayload {
  id: string;
  user_id: string;
  account_id: string;
  category_id?: string;
  amount: number;
  transaction_type: 'income' | 'expense' | 'transfer';
  description?: string;
  transaction_date: string;
  notes?: string;
  transfer_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AccountPayload {
  id: string;
  user_id: string;
  name: string;
  account_type: 'checking' | 'savings' | 'credit_card' | 'investment' | 'loan' | 'other';
  balance: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GoalPayload {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  is_completed: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationPayload {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'budget_alert' | 'goal_milestone' | 'transaction_alert' | 'info';
  is_read: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Event handlers type definitions
export type TransactionEventHandler = (
  payload: RealtimePostgresChangesPayload<TransactionPayload>
) => void;

export type AccountEventHandler = (
  payload: RealtimePostgresChangesPayload<AccountPayload>
) => void;

export type GoalEventHandler = (
  payload: RealtimePostgresChangesPayload<GoalPayload>
) => void;

export type NotificationEventHandler = (
  payload: RealtimePostgresChangesPayload<NotificationPayload>
) => void;

export class RealtimeService {
  private subscriptions: Map<string, RealtimeSubscription> = new Map();
  private userId: string | null = null;

  constructor() {
    this.initializeAuthListener();
  }

  private initializeAuthListener() {
    // Listen for auth state changes to manage subscriptions
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        this.userId = session.user.id;
      } else if (event === 'SIGNED_OUT') {
        this.userId = null;
        this.unsubscribeAll();
      }
    });
  }

  private createChannelName(table: string, userId?: string): string {
    const userSuffix = userId || this.userId || 'anonymous';
    return `realtime:${table}:${userSuffix}`;
  }

  /**
   * Subscribe to transaction changes for the authenticated user
   */
  subscribeToTransactions(
    handlers: {
      onInsert?: TransactionEventHandler;
      onUpdate?: TransactionEventHandler;
      onDelete?: TransactionEventHandler;
    },
    userId?: string
  ): RealtimeSubscription | null {
    const targetUserId = userId || this.userId;
    if (!targetUserId) {
      console.warn('Cannot subscribe to transactions: No user ID available');
      return null;
    }

    const channelName = this.createChannelName('transactions', targetUserId);
    
    // Unsubscribe existing subscription if any
    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${targetUserId}`,
        },
        (payload: RealtimePostgresChangesPayload<TransactionPayload>) => {
          console.log('Transaction change received:', payload);
          
          switch (payload.eventType) {
            case 'INSERT':
              handlers.onInsert?.(payload);
              break;
            case 'UPDATE':
              handlers.onUpdate?.(payload);
              break;
            case 'DELETE':
              handlers.onDelete?.(payload);
              break;
          }
        }
      )
      .subscribe((status) => {
        console.log(`Transactions subscription status: ${status}`);
      });

    const subscription = {
      channel,
      unsubscribe: () => this.unsubscribe(channelName),
    };

    this.subscriptions.set(channelName, subscription);
    return subscription;
  }

  /**
   * Subscribe to account changes for the authenticated user
   */
  subscribeToAccounts(
    handlers: {
      onInsert?: AccountEventHandler;
      onUpdate?: AccountEventHandler;
      onDelete?: AccountEventHandler;
    },
    userId?: string
  ): RealtimeSubscription | null {
    const targetUserId = userId || this.userId;
    if (!targetUserId) {
      console.warn('Cannot subscribe to accounts: No user ID available');
      return null;
    }

    const channelName = this.createChannelName('accounts', targetUserId);
    
    // Unsubscribe existing subscription if any
    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'accounts',
          filter: `user_id=eq.${targetUserId}`,
        },
        (payload: RealtimePostgresChangesPayload<AccountPayload>) => {
          console.log('Account change received:', payload);
          
          switch (payload.eventType) {
            case 'INSERT':
              handlers.onInsert?.(payload);
              break;
            case 'UPDATE':
              handlers.onUpdate?.(payload);
              break;
            case 'DELETE':
              handlers.onDelete?.(payload);
              break;
          }
        }
      )
      .subscribe((status) => {
        console.log(`Accounts subscription status: ${status}`);
      });

    const subscription = {
      channel,
      unsubscribe: () => this.unsubscribe(channelName),
    };

    this.subscriptions.set(channelName, subscription);
    return subscription;
  }

  /**
   * Subscribe to goal changes for the authenticated user
   */
  subscribeToGoals(
    handlers: {
      onInsert?: GoalEventHandler;
      onUpdate?: GoalEventHandler;
      onDelete?: GoalEventHandler;
    },
    userId?: string
  ): RealtimeSubscription | null {
    const targetUserId = userId || this.userId;
    if (!targetUserId) {
      console.warn('Cannot subscribe to goals: No user ID available');
      return null;
    }

    const channelName = this.createChannelName('goals', targetUserId);
    
    // Unsubscribe existing subscription if any
    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goals',
          filter: `user_id=eq.${targetUserId}`,
        },
        (payload: RealtimePostgresChangesPayload<GoalPayload>) => {
          console.log('Goal change received:', payload);
          
          switch (payload.eventType) {
            case 'INSERT':
              handlers.onInsert?.(payload);
              break;
            case 'UPDATE':
              handlers.onUpdate?.(payload);
              break;
            case 'DELETE':
              handlers.onDelete?.(payload);
              break;
          }
        }
      )
      .subscribe((status) => {
        console.log(`Goals subscription status: ${status}`);
      });

    const subscription = {
      channel,
      unsubscribe: () => this.unsubscribe(channelName),
    };

    this.subscriptions.set(channelName, subscription);
    return subscription;
  }

  /**
   * Subscribe to notification changes for the authenticated user
   */
  subscribeToNotifications(
    handlers: {
      onInsert?: NotificationEventHandler;
      onUpdate?: NotificationEventHandler;
      onDelete?: NotificationEventHandler;
    },
    userId?: string
  ): RealtimeSubscription | null {
    const targetUserId = userId || this.userId;
    if (!targetUserId) {
      console.warn('Cannot subscribe to notifications: No user ID available');
      return null;
    }

    const channelName = this.createChannelName('notifications', targetUserId);
    
    // Unsubscribe existing subscription if any
    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${targetUserId}`,
        },
        (payload: RealtimePostgresChangesPayload<NotificationPayload>) => {
          console.log('Notification change received:', payload);
          
          switch (payload.eventType) {
            case 'INSERT':
              handlers.onInsert?.(payload);
              break;
            case 'UPDATE':
              handlers.onUpdate?.(payload);
              break;
            case 'DELETE':
              handlers.onDelete?.(payload);
              break;
          }
        }
      )
      .subscribe((status) => {
        console.log(`Notifications subscription status: ${status}`);
      });

    const subscription = {
      channel,
      unsubscribe: () => this.unsubscribe(channelName),
    };

    this.subscriptions.set(channelName, subscription);
    return subscription;
  }

  /**
   * Unsubscribe from a specific channel
   */
  unsubscribe(channelName: string): void {
    const subscription = this.subscriptions.get(channelName);
    if (subscription) {
      subscription.channel.unsubscribe();
      this.subscriptions.delete(channelName);
      console.log(`Unsubscribed from ${channelName}`);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll(): void {
    console.log(`Unsubscribing from ${this.subscriptions.size} channels`);
    this.subscriptions.forEach((subscription, channelName) => {
      subscription.channel.unsubscribe();
    });
    this.subscriptions.clear();
  }

  /**
   * Get current user ID
   */
  getUserId(): string | null {
    return this.userId;
  }

  /**
   * Get active subscriptions count
   */
  getActiveSubscriptionsCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Get list of active subscription channel names
   */
  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }
}

// Export a singleton instance
export const realtimeService = new RealtimeService();