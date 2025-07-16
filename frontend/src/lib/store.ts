// Simple reactive store implementation for Astro/vanilla JS
// This provides a lightweight state management solution without requiring a framework

export interface StoreListener<T> {
  (value: T): void;
}

export class Store<T> {
  private value: T;
  private listeners: Set<StoreListener<T>> = new Set();

  constructor(initialValue: T) {
    this.value = initialValue;
  }

  get(): T {
    return this.value;
  }

  set(newValue: T): void {
    if (this.value !== newValue) {
      this.value = newValue;
      this.listeners.forEach(listener => listener(newValue));
    }
  }

  update(updater: (currentValue: T) => T): void {
    this.set(updater(this.value));
  }

  subscribe(listener: StoreListener<T>): () => void {
    this.listeners.add(listener);
    // Call listener immediately with current value
    listener(this.value);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Helper method to create derived stores
  derive<U>(transformer: (value: T) => U): Store<U> {
    const derived = new Store(transformer(this.value));
    
    this.subscribe(value => {
      derived.set(transformer(value));
    });
    
    return derived;
  }
}

// Transaction types
export interface Transaction {
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
  // Joined data
  account?: {
    name: string;
    account_type: string;
  };
  category?: {
    name: string;
    color: string;
  };
}

export interface Account {
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

export interface Goal {
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

export interface Notification {
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

// Global stores
export const transactionsStore = new Store<Transaction[]>([]);
export const accountsStore = new Store<Account[]>([]);
export const goalsStore = new Store<Goal[]>([]);
export const notificationsStore = new Store<Notification[]>([]);

// Loading states
export const loadingStates = {
  transactions: new Store<boolean>(false),
  accounts: new Store<boolean>(false),
  goals: new Store<boolean>(false),
  notifications: new Store<boolean>(false),
};

// Error states
export const errorStates = {
  transactions: new Store<string | null>(null),
  accounts: new Store<string | null>(null),
  goals: new Store<string | null>(null),
  notifications: new Store<string | null>(null),
};

// Derived stores for commonly needed data
export const unreadNotificationsCount = notificationsStore.derive(
  notifications => notifications.filter(n => !n.is_read).length
);

export const totalNetWorth = accountsStore.derive(accounts => {
  const assets = accounts
    .filter(account => account.balance > 0)
    .reduce((sum, account) => sum + account.balance, 0);
  
  const liabilities = Math.abs(accounts
    .filter(account => account.balance < 0)
    .reduce((sum, account) => sum + account.balance, 0));
  
  return { assets, liabilities, netWorth: assets - liabilities };
});

export const activeGoalsProgress = goalsStore.derive(goals => {
  const activeGoals = goals.filter(g => !g.is_completed && g.is_active);
  const totalTarget = activeGoals.reduce((sum, g) => sum + g.target_amount, 0);
  const totalCurrent = activeGoals.reduce((sum, g) => sum + g.current_amount, 0);
  const overallProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;
  
  return {
    count: activeGoals.length,
    totalTarget,
    totalCurrent,
    overallProgress: Math.min(overallProgress, 100),
  };
});

// Helper functions for updating stores
export const storeHelpers = {
  // Transaction helpers
  addTransaction: (transaction: Transaction) => {
    transactionsStore.update(transactions => [transaction, ...transactions]);
  },
  
  updateTransaction: (updatedTransaction: Transaction) => {
    transactionsStore.update(transactions =>
      transactions.map(t => t.id === updatedTransaction.id ? updatedTransaction : t)
    );
  },
  
  removeTransaction: (transactionId: string) => {
    transactionsStore.update(transactions =>
      transactions.filter(t => t.id !== transactionId)
    );
  },

  // Account helpers
  addAccount: (account: Account) => {
    accountsStore.update(accounts => [account, ...accounts]);
  },
  
  updateAccount: (updatedAccount: Account) => {
    accountsStore.update(accounts =>
      accounts.map(a => a.id === updatedAccount.id ? updatedAccount : a)
    );
  },
  
  removeAccount: (accountId: string) => {
    accountsStore.update(accounts =>
      accounts.filter(a => a.id !== accountId)
    );
  },

  // Goal helpers
  addGoal: (goal: Goal) => {
    goalsStore.update(goals => [goal, ...goals]);
  },
  
  updateGoal: (updatedGoal: Goal) => {
    goalsStore.update(goals =>
      goals.map(g => g.id === updatedGoal.id ? updatedGoal : g)
    );
  },
  
  removeGoal: (goalId: string) => {
    goalsStore.update(goals =>
      goals.filter(g => g.id !== goalId)
    );
  },

  // Notification helpers
  addNotification: (notification: Notification) => {
    notificationsStore.update(notifications => [notification, ...notifications]);
  },
  
  updateNotification: (updatedNotification: Notification) => {
    notificationsStore.update(notifications =>
      notifications.map(n => n.id === updatedNotification.id ? updatedNotification : n)
    );
  },
  
  removeNotification: (notificationId: string) => {
    notificationsStore.update(notifications =>
      notifications.filter(n => n.id !== notificationId)
    );
  },

  markNotificationAsRead: (notificationId: string) => {
    notificationsStore.update(notifications =>
      notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      )
    );
  },

  markAllNotificationsAsRead: () => {
    notificationsStore.update(notifications =>
      notifications.map(n => ({ ...n, is_read: true }))
    );
  },

  // Clear all stores (useful for logout)
  clearAll: () => {
    transactionsStore.set([]);
    accountsStore.set([]);
    goalsStore.set([]);
    notificationsStore.set([]);
    
    // Reset loading and error states
    Object.values(loadingStates).forEach(store => store.set(false));
    Object.values(errorStates).forEach(store => store.set(null));
  },
};