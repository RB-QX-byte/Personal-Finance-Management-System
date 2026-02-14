import { useState, useEffect } from 'react';
import api from '../services/api';

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
    description: '',
    category: 'savings',
    priority: 'medium',
    icon: '🎯',
    color: '#0284c7'
  });

  const categories = [
    { value: 'savings', label: 'Savings' },
    { value: 'investment', label: 'Investment' },
    { value: 'purchase', label: 'Purchase' },
    { value: 'debt_payoff', label: 'Debt Payoff' },
    { value: 'emergency_fund', label: 'Emergency Fund' },
    { value: 'vacation', label: 'Vacation' },
    { value: 'education', label: 'Education' },
    { value: 'other', label: 'Other' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'text-gray-600' },
    { value: 'medium', label: 'Medium', color: 'text-warning-600' },
    { value: 'high', label: 'High', color: 'text-danger-600' }
  ];

  const goalIcons = ['🎯', '🏠', '🚗', '✈️', '💰', '📚', '💍', '🏦', '🎓', '🏝️'];

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await api.get('/goals');
      setGoals(response.data);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingGoal) {
        await api.put(`/goals/${editingGoal._id}`, formData);
      } else {
        await api.post('/goals', formData);
      }
      setShowModal(false);
      setEditingGoal(null);
      resetForm();
      fetchGoals();
    } catch (error) {
      console.error('Error saving goal:', error);
      alert('Failed to save goal');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      targetAmount: '',
      currentAmount: '',
      targetDate: '',
      description: '',
      category: 'savings',
      priority: 'medium',
      icon: '🎯',
      color: '#0284c7'
    });
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      targetDate: goal.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : '',
      description: goal.description || '',
      category: goal.category || 'savings',
      priority: goal.priority || 'medium',
      icon: goal.icon || '🎯',
      color: goal.color || '#0284c7'
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        await api.delete(`/goals/${id}`);
        fetchGoals();
      } catch (error) {
        console.error('Error deleting goal:', error);
        alert('Failed to delete goal');
      }
    }
  };

  const handleAddFunds = async (goal) => {
    const amount = prompt('Enter amount to add:');
    if (amount && !isNaN(parseFloat(amount))) {
      try {
        await api.put(`/goals/${goal._id}/progress`, {
          amount: parseFloat(amount)
        });
        fetchGoals();
      } catch (error) {
        console.error('Error updating goal:', error);
        alert('Failed to add funds');
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const getDaysRemaining = (targetDate) => {
    if (!targetDate) return null;
    const target = new Date(targetDate);
    const today = new Date();
    const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Calculate totals
  const totalTarget = goals.reduce((sum, g) => sum + (g.targetAmount || 0), 0);
  const totalSaved = goals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);
  const completedGoals = goals.filter(g => g.currentAmount >= g.targetAmount).length;

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading goals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Goals</h1>
              <p className="text-sm text-gray-600 mt-1">Track your financial goals and milestones</p>
            </div>
            <button
              onClick={() => {
                setEditingGoal(null);
                resetForm();
                setShowModal(true);
              }}
              className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors"
            >
              Create Goal
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Total Goals</p>
            <p className="text-3xl font-bold text-gray-900">{goals.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Target Amount</p>
            <p className="text-3xl font-bold text-primary-600">{formatCurrency(totalTarget)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Total Saved</p>
            <p className="text-3xl font-bold text-success-600">{formatCurrency(totalSaved)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Completed</p>
            <p className="text-3xl font-bold text-indigo-600">{completedGoals} / {goals.length}</p>
          </div>
        </div>

        {/* Goals Grid */}
        {goals.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No goals yet</h3>
              <p className="text-gray-600 mb-4">Set your first financial goal to start tracking your progress</p>
              <button
                onClick={() => setShowModal(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
              >
                Create Your First Goal
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal) => {
              const percentage = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
              const isCompleted = percentage >= 100;
              const daysRemaining = getDaysRemaining(goal.targetDate);

              return (
                <div
                  key={goal._id}
                  className={`bg-white rounded-lg shadow-sm border ${isCompleted ? 'border-success-300' : 'border-gray-200'} p-6`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                        style={{ backgroundColor: `${goal.color || '#0284c7'}20` }}
                      >
                        {goal.icon || '🎯'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{goal.name}</h3>
                        <p className="text-sm text-gray-500 capitalize">{goal.category?.replace('_', ' ')}</p>
                      </div>
                    </div>
                    {isCompleted && (
                      <span className="bg-success-100 text-success-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
                        ✓ Complete
                      </span>
                    )}
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">
                        {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-300 ${isCompleted ? 'bg-success-500' : 'bg-primary-500'
                          }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{percentage.toFixed(0)}% saved</span>
                      {daysRemaining !== null && (
                        <span className={daysRemaining < 0 ? 'text-danger-500' : ''}>
                          {daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days left`}
                        </span>
                      )}
                    </div>
                  </div>

                  {goal.description && (
                    <p className="text-sm text-gray-600 mb-4">{goal.description}</p>
                  )}

                  <div className="flex space-x-2 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleAddFunds(goal)}
                      className="flex-1 text-center py-2 text-sm font-medium text-success-600 hover:bg-success-50 rounded-md transition-colors"
                    >
                      Add Funds
                    </button>
                    <button
                      onClick={() => handleEdit(goal)}
                      className="flex-1 text-center py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(goal._id)}
                      className="flex-1 text-center py-2 text-sm font-medium text-danger-600 hover:bg-danger-50 rounded-md transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div
              className="fixed inset-0 bg-gray-600 bg-opacity-50"
              onClick={() => setShowModal(false)}
            ></div>
            <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all max-w-md w-full z-20 max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingGoal ? 'Edit Goal' : 'Create New Goal'}
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Goal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., Emergency Fund"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Amount *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={formData.targetAmount}
                      onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.currentAmount}
                      onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {priorities.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Icon
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {goalIcons.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon })}
                        className={`w-10 h-10 text-xl rounded-md border-2 transition-colors ${formData.icon === icon
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="What's this goal for?"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors"
                  >
                    {editingGoal ? 'Save Changes' : 'Create Goal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;
