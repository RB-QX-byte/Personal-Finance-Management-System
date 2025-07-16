import { transactionsStore, accountsStore, goalsStore, notificationsStore, loadingStates, errorStates } from './store';
import { supabase } from './supabase';

export interface InitialData {
  transactions?: any[];
  accounts?: any[];
  goals?: any[];
  notifications?: any[];
}

/**
 * Initialize stores with initial data and optionally fetch fresh data
 */
export class StoreInitializer {
  private userId: string | null = null;

  constructor() {
    this.initializeAuthListener();
  }

  private initializeAuthListener() {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        this.userId = session.user.id;
      } else if (event === 'SIGNED_OUT') {
        this.userId = null;
        this.clearStores();
      }
    });
  }

  /**
   * Initialize stores with provided initial data
   */
  initializeWithData(data: InitialData): void {
    console.log('Initializing stores with data:', data);

    if (data.transactions) {
      transactionsStore.set(data.transactions);
    }

    if (data.accounts) {
      accountsStore.set(data.accounts);
    }

    if (data.goals) {
      goalsStore.set(data.goals);
    }

    if (data.notifications) {
      notificationsStore.set(data.notifications);
    }
  }

  /**
   * Fetch and initialize all data for the current user
   */
  async initializeAll(userId?: string): Promise<void> {
    const targetUserId = userId || this.userId;
    if (!targetUserId) {
      console.warn('Cannot initialize stores: No user ID available');
      return;
    }

    console.log('Fetching all data for user:', targetUserId);

    // Set loading states
    Object.values(loadingStates).forEach(store => store.set(true));

    try {
      // Fetch all data in parallel
      const [transactionsResult, accountsResult, goalsResult, notificationsResult] = await Promise.allSettled([
        this.fetchTransactions(targetUserId),
        this.fetchAccounts(targetUserId),
        this.fetchGoals(targetUserId),
        this.fetchNotifications(targetUserId),
      ]);

      // Handle transactions
      if (transactionsResult.status === 'fulfilled') {
        transactionsStore.set(transactionsResult.value);
        errorStates.transactions.set(null);
      } else {
        console.error('Failed to fetch transactions:', transactionsResult.reason);
        errorStates.transactions.set(transactionsResult.reason.message);
      }

      // Handle accounts
      if (accountsResult.status === 'fulfilled') {
        accountsStore.set(accountsResult.value);
        errorStates.accounts.set(null);
      } else {
        console.error('Failed to fetch accounts:', accountsResult.reason);
        errorStates.accounts.set(accountsResult.reason.message);
      }

      // Handle goals
      if (goalsResult.status === 'fulfilled') {
        goalsStore.set(goalsResult.value);
        errorStates.goals.set(null);
      } else {
        console.error('Failed to fetch goals:', goalsResult.reason);
        errorStates.goals.set(goalsResult.reason.message);
      }

      // Handle notifications
      if (notificationsResult.status === 'fulfilled') {
        notificationsStore.set(notificationsResult.value);
        errorStates.notifications.set(null);
      } else {
        console.error('Failed to fetch notifications:', notificationsResult.reason);
        errorStates.notifications.set(notificationsResult.reason.message);
      }

    } catch (error) {
      console.error('Error initializing stores:', error);
    } finally {
      // Clear loading states
      Object.values(loadingStates).forEach(store => store.set(false));
    }
  }

  /**
   * Fetch transactions for user
   */
  private async fetchTransactions(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        accounts(id, name, account_type),
        categories(id, name, color, icon)
      `)
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  }

  /**
   * Fetch accounts for user
   */
  private async fetchAccounts(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Fetch goals for user
   */
  private async fetchGoals(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Fetch notifications for user
   */
  private async fetchNotifications(userId: string): Promise<any[]> {
    // For now, return empty array since notifications table might not exist yet
    // This will be implemented in subtask 10.3
    return [];
  }

  /**
   * Clear all stores
   */
  private clearStores(): void {
    transactionsStore.set([]);
    accountsStore.set([]);
    goalsStore.set([]);
    notificationsStore.set([]);
    
    // Reset states
    Object.values(loadingStates).forEach(store => store.set(false));
    Object.values(errorStates).forEach(store => store.set(null));
  }

  /**
   * Refresh specific data
   */
  async refreshTransactions(userId?: string): Promise<void> {
    const targetUserId = userId || this.userId;
    if (!targetUserId) return;

    loadingStates.transactions.set(true);
    try {
      const transactions = await this.fetchTransactions(targetUserId);
      transactionsStore.set(transactions);
      errorStates.transactions.set(null);
    } catch (error: any) {
      console.error('Failed to refresh transactions:', error);
      errorStates.transactions.set(error.message);
    } finally {
      loadingStates.transactions.set(false);
    }
  }

  async refreshAccounts(userId?: string): Promise<void> {
    const targetUserId = userId || this.userId;
    if (!targetUserId) return;

    loadingStates.accounts.set(true);
    try {
      const accounts = await this.fetchAccounts(targetUserId);
      accountsStore.set(accounts);
      errorStates.accounts.set(null);
    } catch (error: any) {
      console.error('Failed to refresh accounts:', error);
      errorStates.accounts.set(error.message);
    } finally {
      loadingStates.accounts.set(false);
    }
  }

  async refreshGoals(userId?: string): Promise<void> {
    const targetUserId = userId || this.userId;
    if (!targetUserId) return;

    loadingStates.goals.set(true);
    try {
      const goals = await this.fetchGoals(targetUserId);
      goalsStore.set(goals);
      errorStates.goals.set(null);
    } catch (error: any) {
      console.error('Failed to refresh goals:', error);
      errorStates.goals.set(error.message);
    } finally {
      loadingStates.goals.set(false);
    }
  }
}

// Export singleton instance
export const storeInitializer = new StoreInitializer();