import { useState, useEffect } from 'react';
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

  if (loading) {
    return <div className="text-center py-10">Loading dashboard...</div>;
  }

  if (!dashboardData) {
    return <div className="text-center py-10">No data available</div>;
  }

  const { summary, accounts, recentTransactions, budgets, goals } = dashboardData;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Total Balance</p>
          <p className="text-3xl font-bold text-blue-600">
            ${summary.totalBalance.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Monthly Income</p>
          <p className="text-3xl font-bold text-green-600">
            ${summary.monthlyIncome.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Monthly Expenses</p>
          <p className="text-3xl font-bold text-red-600">
            ${summary.monthlyExpenses.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Net Income</p>
          <p className={`text-3xl font-bold ${summary.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${summary.netIncome.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
          <div className="space-y-3">
            {recentTransactions && recentTransactions.length > 0 ? (
              recentTransactions.map((transaction) => (
                <div key={transaction._id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-medium">{transaction.description || 'No description'}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(transaction.transactionDate).toLocaleDateString()}
                    </p>
                  </div>
                  <p className={`font-semibold ${
                    transaction.transactionType === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.transactionType === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No recent transactions</p>
            )}
          </div>
        </div>

        {/* Accounts */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Accounts</h2>
          <div className="space-y-3">
            {accounts && accounts.length > 0 ? (
              accounts.map((account) => (
                <div key={account._id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-medium">{account.name}</p>
                    <p className="text-sm text-gray-500">{account.accountType}</p>
                  </div>
                  <p className="font-semibold text-blue-600">
                    ${account.balance.toFixed(2)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No accounts found</p>
            )}
          </div>
        </div>

        {/* Active Budgets */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Active Budgets</h2>
          <div className="space-y-3">
            {budgets && budgets.length > 0 ? (
              budgets.map((budget) => {
                const percentage = (budget.spent / budget.amount) * 100;
                return (
                  <div key={budget._id} className="border-b pb-2">
                    <div className="flex justify-between mb-1">
                      <p className="font-medium">{budget.name}</p>
                      <p className="text-sm text-gray-600">
                        ${budget.spent?.toFixed(2) || '0.00'} / ${budget.amount.toFixed(2)}
                      </p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          percentage >= 100 ? 'bg-red-600' : percentage >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500">No active budgets</p>
            )}
          </div>
        </div>

        {/* Goals */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Goals</h2>
          <div className="space-y-3">
            {goals && goals.length > 0 ? (
              goals.map((goal) => {
                const percentage = (goal.currentAmount / goal.targetAmount) * 100;
                return (
                  <div key={goal._id} className="border-b pb-2">
                    <div className="flex justify-between mb-1">
                      <p className="font-medium">{goal.name}</p>
                      <p className="text-sm text-gray-600">
                        ${goal.currentAmount.toFixed(2)} / ${goal.targetAmount.toFixed(2)}
                      </p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500">No goals set</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
