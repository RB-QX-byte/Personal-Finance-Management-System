import { useState, useEffect } from 'react';
import api from '../services/api';
import SmartTransactionForm from '../components/SmartTransactionForm';
import ReceiptScanner from '../components/ReceiptScanner';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showReceiptScanner, setShowReceiptScanner] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    accountId: '',
    categoryId: '',
    startDate: '',
    endDate: '',
    search: ''
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  const [formData, setFormData] = useState({
    accountId: '',
    categoryId: '',
    amount: '',
    transactionType: 'expense',
    description: '',
    transactionDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [transResponse, accountsResponse, categoriesResponse] = await Promise.all([
        api.get('/transactions'),
        api.get('/accounts'),
        api.get('/categories')
      ]);
      setTransactions(transResponse.data);
      setTotalCount(transResponse.data.length);
      setAccounts(accountsResponse.data);
      setCategories(categoriesResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data) => {
    try {
      if (editingTransaction) {
        await api.put(`/transactions/${editingTransaction._id}`, data);
      } else {
        await api.post('/transactions', data);
      }
      setShowModal(false);
      setEditingTransaction(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Failed to save transaction');
    }
  };

  const resetForm = () => {
    setFormData({
      accountId: '',
      categoryId: '',
      amount: '',
      transactionType: 'expense',
      description: '',
      transactionDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      accountId: transaction.accountId?._id || '',
      categoryId: transaction.categoryId?._id || '',
      amount: transaction.amount,
      transactionType: transaction.transactionType,
      description: transaction.description || '',
      transactionDate: new Date(transaction.transactionDate).toISOString().split('T')[0],
      notes: transaction.notes || ''
    });
    setShowModal(true);
  };

  const handleReceiptDataExtracted = (extractedData) => {
    setFormData({
      ...formData,
      description: extractedData.description || formData.description,
      amount: extractedData.amount || formData.amount,
      transactionDate: extractedData.date
        ? new Date(extractedData.date).toISOString().split('T')[0]
        : formData.transactionDate
    });
    setShowReceiptScanner(false);
    setShowModal(true);
  };

  const openAddTransaction = () => {
    setEditingTransaction(null);
    resetForm();
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await api.delete(`/transactions/${id}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting transaction:', error);
        alert('Failed to delete transaction');
      }
    }
  };

  const applyFilters = () => {
    setCurrentPage(0);
    fetchData();
  };

  const clearFilters = () => {
    setFilters({
      accountId: '',
      categoryId: '',
      startDate: '',
      endDate: '',
      search: ''
    });
    setCurrentPage(0);
    fetchData();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filter transactions based on search
  const filteredTransactions = transactions.filter(t => {
    if (filters.search && !t.description?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.accountId && t.accountId?._id !== filters.accountId) {
      return false;
    }
    if (filters.categoryId && t.categoryId?._id !== filters.categoryId) {
      return false;
    }
    return true;
  });

  // Paginate
  const paginatedTransactions = filteredTransactions.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading transactions...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
              <p className="text-sm text-gray-600 mt-1">Track your income and expenses</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowReceiptScanner(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors flex items-center gap-2"
              >
                📸 Scan Receipt
              </button>
              <button
                onClick={openAddTransaction}
                className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors"
              >
                Add Transaction
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="account-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Account
              </label>
              <select
                id="account-filter"
                value={filters.accountId}
                onChange={(e) => setFilters({ ...filters, accountId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Accounts</option>
                {accounts.map(account => (
                  <option key={account._id} value={account._id}>
                    {account.name} ({account.accountType?.replace('_', ' ')})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="category-filter"
                value={filters.categoryId}
                onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="start-date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="end-date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="search-input" className="block text-sm font-medium text-gray-700 mb-1">
              Search Description
            </label>
            <div className="relative">
              <input
                type="text"
                id="search-input"
                placeholder="Search transactions..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="mt-4 flex space-x-3">
            <button
              onClick={applyFilters}
              className="bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
            >
              Apply Filters
            </button>
            <button
              onClick={clearFilters}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-md text-sm font-medium transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Empty State */}
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions found</h3>
              <p className="text-gray-600 mb-4">Start tracking your finances by adding your first transaction</p>
              <button
                onClick={openAddTransaction}
                className="bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
              >
                Add Your First Transaction
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Transactions Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Account
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedTransactions.map((transaction) => (
                      <tr key={transaction._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(transaction.transactionDate)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="font-medium">{transaction.description || 'No description'}</div>
                          {transaction.notes && (
                            <div className="text-gray-500 text-xs">{transaction.notes}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.categoryId ? (
                            <span
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: `${transaction.categoryId.color || '#6366f1'}20`,
                                color: transaction.categoryId.color || '#6366f1'
                              }}
                            >
                              {transaction.categoryId.name}
                            </span>
                          ) : (
                            <span className="text-gray-400">Uncategorized</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.accountId?.name || 'Unknown'}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${transaction.transactionType === 'income' ? 'text-success-600' : 'text-danger-600'
                          }`}>
                          {transaction.transactionType === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(transaction)}
                              className="text-primary-600 hover:text-primary-700 font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(transaction._id)}
                              className="text-danger-600 hover:text-danger-700 font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{currentPage * pageSize + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min((currentPage + 1) * pageSize, filteredTransactions.length)}
                      </span>{' '}
                      of <span className="font-medium">{filteredTransactions.length}</span> transactions
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                        disabled={currentPage === 0}
                        className="relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        disabled={(currentPage + 1) * pageSize >= filteredTransactions.length}
                        className="relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Smart Transaction Form Modal */}
      {showModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div
              className="fixed inset-0 bg-gray-600 bg-opacity-50"
              onClick={() => {
                setShowModal(false);
                setEditingTransaction(null);
              }}
            ></div>
            <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all max-w-2xl w-full z-20 max-h-[90vh] overflow-y-auto">
              <SmartTransactionForm
                initialData={formData}
                categories={categories}
                accounts={accounts}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setShowModal(false);
                  setEditingTransaction(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Receipt Scanner Modal */}
      {showReceiptScanner && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div
              className="fixed inset-0 bg-gray-600 bg-opacity-50"
              onClick={() => setShowReceiptScanner(false)}
            ></div>
            <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all max-w-3xl w-full z-20 max-h-[90vh] overflow-y-auto">
              <ReceiptScanner
                onDataExtracted={handleReceiptDataExtracted}
                onCancel={() => setShowReceiptScanner(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
