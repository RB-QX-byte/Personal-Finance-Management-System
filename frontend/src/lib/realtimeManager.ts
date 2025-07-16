import { realtimeService } from './realtime';
import { storeHelpers } from './store';
import type { RealtimeSubscription } from './realtime';

/**
 * Central manager for handling real-time subscriptions and data synchronization
 */
export class RealtimeManager {
  private subscriptions: RealtimeSubscription[] = [];
  private isInitialized = false;

  /**
   * Initialize all real-time subscriptions for the current user
   */
  initialize(userId?: string): void {
    if (this.isInitialized) {
      console.log('RealtimeManager already initialized');
      return;
    }

    console.log('Initializing RealtimeManager...');

    // Subscribe to transactions
    const transactionSub = realtimeService.subscribeToTransactions({
      onInsert: (payload) => {
        console.log('🆕 New transaction received:', payload.new);
        if (payload.new) {
          storeHelpers.addTransaction(payload.new);
          this.showToast('New transaction added', 'success');
        }
      },
      onUpdate: (payload) => {
        console.log('📝 Transaction updated:', payload.new);
        if (payload.new) {
          storeHelpers.updateTransaction(payload.new);
          this.showToast('Transaction updated', 'info');
        }
      },
      onDelete: (payload) => {
        console.log('🗑️ Transaction deleted:', payload.old);
        if (payload.old?.id) {
          storeHelpers.removeTransaction(payload.old.id);
          this.showToast('Transaction deleted', 'warning');
        }
      },
    }, userId);

    if (transactionSub) {
      this.subscriptions.push(transactionSub);
    }

    // Subscribe to accounts
    const accountSub = realtimeService.subscribeToAccounts({
      onInsert: (payload) => {
        console.log('🆕 New account received:', payload.new);
        if (payload.new) {
          storeHelpers.addAccount(payload.new);
          this.showToast('New account added', 'success');
        }
      },
      onUpdate: (payload) => {
        console.log('📝 Account updated:', payload.new);
        if (payload.new) {
          storeHelpers.updateAccount(payload.new);
          this.showToast('Account updated', 'info');
        }
      },
      onDelete: (payload) => {
        console.log('🗑️ Account deleted:', payload.old);
        if (payload.old?.id) {
          storeHelpers.removeAccount(payload.old.id);
          this.showToast('Account deleted', 'warning');
        }
      },
    }, userId);

    if (accountSub) {
      this.subscriptions.push(accountSub);
    }

    // Subscribe to goals
    const goalSub = realtimeService.subscribeToGoals({
      onInsert: (payload) => {
        console.log('🆕 New goal received:', payload.new);
        if (payload.new) {
          storeHelpers.addGoal(payload.new);
          this.showToast('New goal created', 'success');
        }
      },
      onUpdate: (payload) => {
        console.log('📝 Goal updated:', payload.new);
        if (payload.new) {
          storeHelpers.updateGoal(payload.new);
          
          // Check if goal was completed
          if (payload.new.is_completed && payload.old && !payload.old.is_completed) {
            this.showToast(`🎉 Goal "${payload.new.name}" completed!`, 'success', 5000);
          } else {
            this.showToast('Goal updated', 'info');
          }
        }
      },
      onDelete: (payload) => {
        console.log('🗑️ Goal deleted:', payload.old);
        if (payload.old?.id) {
          storeHelpers.removeGoal(payload.old.id);
          this.showToast('Goal deleted', 'warning');
        }
      },
    }, userId);

    if (goalSub) {
      this.subscriptions.push(goalSub);
    }

    // Subscribe to notifications
    const notificationSub = realtimeService.subscribeToNotifications({
      onInsert: (payload) => {
        console.log('🔔 New notification received:', payload.new);
        if (payload.new) {
          storeHelpers.addNotification(payload.new);
          this.showNotificationToast(payload.new);
        }
      },
      onUpdate: (payload) => {
        console.log('📝 Notification updated:', payload.new);
        if (payload.new) {
          storeHelpers.updateNotification(payload.new);
        }
      },
      onDelete: (payload) => {
        console.log('🗑️ Notification deleted:', payload.old);
        if (payload.old?.id) {
          storeHelpers.removeNotification(payload.old.id);
        }
      },
    }, userId);

    if (notificationSub) {
      this.subscriptions.push(notificationSub);
    }

    this.isInitialized = true;
    console.log(`✅ RealtimeManager initialized with ${this.subscriptions.length} subscriptions`);
  }

  /**
   * Clean up all subscriptions
   */
  cleanup(): void {
    console.log('Cleaning up RealtimeManager...');
    
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
    
    this.subscriptions = [];
    this.isInitialized = false;
    
    // Clear all store data
    storeHelpers.clearAll();
    
    console.log('✅ RealtimeManager cleaned up');
  }

  /**
   * Show a toast notification to the user
   */
  private showToast(message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info', duration = 3000): void {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white font-medium transition-all duration-300 transform translate-x-full`;
    
    // Set colors based on type
    switch (type) {
      case 'success':
        toast.className += ' bg-green-600';
        break;
      case 'warning':
        toast.className += ' bg-yellow-600';
        break;
      case 'error':
        toast.className += ' bg-red-600';
        break;
      default:
        toast.className += ' bg-blue-600';
        break;
    }
    
    toast.textContent = message;
    
    // Add to DOM
    document.body.appendChild(toast);
    
    // Animate in
    requestAnimationFrame(() => {
      toast.classList.remove('translate-x-full');
    });
    
    // Remove after duration
    setTimeout(() => {
      toast.classList.add('translate-x-full');
      setTimeout(() => {
        if (toast.parentNode) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, duration);
  }

  /**
   * Show a specialized notification toast
   */
  private showNotificationToast(notification: any): void {
    let icon = '🔔';
    let type: 'success' | 'info' | 'warning' | 'error' = 'info';
    
    switch (notification.type) {
      case 'budget_alert':
        icon = '⚠️';
        type = 'warning';
        break;
      case 'goal_milestone':
        icon = '🎯';
        type = 'success';
        break;
      case 'transaction_alert':
        icon = '💰';
        type = 'info';
        break;
      default:
        icon = 'ℹ️';
        type = 'info';
        break;
    }
    
    this.showToast(`${icon} ${notification.title}: ${notification.message}`, type, 5000);
  }

  /**
   * Get initialization status
   */
  getStatus(): { isInitialized: boolean; subscriptionCount: number } {
    return {
      isInitialized: this.isInitialized,
      subscriptionCount: this.subscriptions.length,
    };
  }

  /**
   * Force reinitialize (useful for debugging)
   */
  reinitialize(userId?: string): void {
    this.cleanup();
    this.initialize(userId);
  }
}

// Export singleton instance
export const realtimeManager = new RealtimeManager();

// Global functions for easy access from anywhere
declare global {
  interface Window {
    realtimeManager: RealtimeManager;
    realtimeService: typeof realtimeService;
  }
}

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.realtimeManager = realtimeManager;
  window.realtimeService = realtimeService;
}