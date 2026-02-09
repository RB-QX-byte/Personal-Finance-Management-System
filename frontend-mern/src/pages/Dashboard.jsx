import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const { summary, accounts, recentTransactions, budgets, goals } = dashboardData || {};

  // Calculate net worth
  const totalAssets = accounts?.filter(a => a.balance > 0).reduce((sum, a) => sum + a.balance, 0) || 0;
  const totalLiabilities = Math.abs(accounts?.filter(a => a.balance < 0).reduce((sum, a) => sum + a.balance, 0) || 0);
  const netWorth = totalAssets - totalLiabilities;

  return (
    <div className="bg-gray-50">
      {/* Page Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Welcome back! Here's your financial overview.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Net Worth & Quick Actions Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Net Worth Tracker */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Net Worth</h3>
                <div className="text-3xl font-bold text-primary-600 mb-4">
                  {formatCurrency(netWorth)}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Assets</span>
                    <span className="text-success-600 font-medium">{formatCurrency(totalAssets)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Liabilities</span>
                    <span className="text-danger-600 font-medium">{formatCurrency(totalLiabilities)}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/transactions"
                    className="flex items-center justify-center px-4 py-3 bg-primary-50 text-primary-700 rounded-md hover:bg-primary-100 transition-colors text-sm font-medium"
                  >
                    ➕ Add Transaction
                  </Link>
                  <Link
                    to="/accounts"
                    className="flex items-center justify-center px-4 py-3 bg-success-50 text-success-700 rounded-md hover:bg-success-100 transition-colors text-sm font-medium"
                  >
                    🏦 New Account
                  </Link>
                  <Link
                    to="/budgets"
                    className="flex items-center justify-center px-4 py-3 bg-warning-50 text-warning-700 rounded-md hover:bg-warning-100 transition-colors text-sm font-medium"
                  >
                    📊 Set Budget
                  </Link>
                  <Link
                    to="/goals"
                    className="flex items-center justify-center px-4 py-3 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 transition-colors text-sm font-medium"
                  >
                    🎯 New Goal
                  </Link>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <p className="text-sm text-gray-600 mb-1">Total Balance</p>
                <p className="text-2xl font-bold text-primary-600">
                  {formatCurrency(summary?.totalBalance)}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <p className="text-sm text-gray-600 mb-1">Monthly Income</p>
                <p className="text-2xl font-bold text-success-600">
                  {formatCurrency(summary?.monthlyIncome)}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <p className="text-sm text-gray-600 mb-1">Monthly Expenses</p>
                <p className="text-2xl font-bold text-danger-600">
                  {formatCurrency(summary?.monthlyExpenses)}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <p className="text-sm text-gray-600 mb-1">Net Income</p>
                <p className={`text-2xl font-bold ${(summary?.netIncome || 0) >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                  {formatCurrency(summary?.netIncome)}
                </p>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
                <Link to="/transactions" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  View All →
                </Link>
              </div>
              <div className="space-y-3">
                {recentTransactions && recentTransactions.length > 0 ? (
                  recentTransactions.slice(0, 5).map((transaction) => (
                    <div key={transaction._id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${transaction.transactionType === 'income' ? 'bg-success-100' : 'bg-danger-100'
                          }`}>
                          <span className="text-lg">
                            {transaction.transactionType === 'income' ? '💰' : '💳'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{transaction.description || 'No description'}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(transaction.transactionDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <p className={`font-semibold ${transaction.transactionType === 'income' ? 'text-success-600' : 'text-danger-600'
                        }`}>
                        {transaction.transactionType === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No recent transactions</p>
                    <Link to="/transactions" className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-2 inline-block">
                      Add your first transaction
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Goals Overview */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Goals Progress</h3>
                <Link to="/goals" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  View All →
                </Link>
              </div>
              <div className="space-y-4">
                {goals && goals.length > 0 ? (
                  goals.slice(0, 3).map((goal) => {
                    const percentage = (goal.currentAmount / goal.targetAmount) * 100;
                    return (
                      <div key={goal._id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                        <div className="flex justify-between items-center mb-2">
                          <p className="font-medium text-gray-900">{goal.name}</p>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                          </p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{percentage.toFixed(0)}% complete</p>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No goals set</p>
                    <Link to="/goals" className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-2 inline-block">
                      Create your first goal
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Account Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Accounts</h3>
                <Link to="/accounts" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  Manage →
                </Link>
              </div>
              <div className="space-y-3">
                {accounts && accounts.length > 0 ? (
                  accounts.map((account) => (
                    <div key={account._id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="font-medium text-gray-900">{account.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{account.accountType?.replace('_', ' ')}</p>
                      </div>
                      <p className={`font-semibold ${account.balance >= 0 ? 'text-primary-600' : 'text-danger-600'}`}>
                        {formatCurrency(account.balance)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">No accounts found</p>
                    <Link to="/accounts" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                      Add an account
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Budget Overview */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Active Budgets</h3>
                <Link to="/budgets" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  View All →
                </Link>
              </div>
              <div className="space-y-4">
                {budgets && budgets.length > 0 ? (
                  budgets.slice(0, 4).map((budget) => {
                    const percentage = (budget.spent / budget.amount) * 100;
                    const isOverBudget = percentage >= 100;
                    const isNearBudget = percentage >= 80 && percentage < 100;

                    return (
                      <div key={budget._id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                        <div className="flex justify-between items-center mb-1">
                          <p className="font-medium text-gray-900 text-sm">{budget.name}</p>
                          <p className="text-xs text-gray-600">
                            {formatCurrency(budget.spent || 0)} / {formatCurrency(budget.amount)}
                          </p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${isOverBudget ? 'bg-danger-500' : isNearBudget ? 'bg-warning-500' : 'bg-success-500'
                              }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">No active budgets</p>
                    <Link to="/budgets" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                      Create a budget
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
