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
  }, []);

  const fetchData = async () => {
    try {
      const [transResponse, accountsResponse, categoriesResponse] = await Promise.all([
        api.get('/transactions'),
        api.get('/accounts'),
        api.get('/categories')
      ]);
      setTransactions(transResponse.data);
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
        // Update existing transaction
        await api.put(`/transactions/${editingTransaction._id}`, data);
      } else {
        // Create new transaction
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
    // Pre-fill form with extracted data
    setFormData({
      ...formData,
      description: extractedData.description || formData.description,
      amount: extractedData.amount || formData.amount,
      transactionDate: extractedData.date
        ? new Date(extractedData.date).toISOString().split('T')[0]
        : formData.transactionDate
    });

    // Close receipt scanner and open smart form
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

  if (loading) {
    return <div className="text-center py-10">Loading transactions...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowReceiptScanner(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2"
          >
            📸 Scan Receipt
          </button>
          <button
            onClick={openAddTransaction}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            ✨ Add Transaction
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
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
            {transactions.map((transaction) => (
              <tr key={transaction._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(transaction.transactionDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {transaction.description || 'No description'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {transaction.categoryId?.name || 'Uncategorized'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {transaction.accountId?.name || 'Unknown'}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                  transaction.transactionType === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.transactionType === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEdit(transaction)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(transaction._id)}
                      className="text-red-600 hover:text-red-900"
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

      {/* Smart Transaction Form Modal */}
      {showModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75"
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
              className="fixed inset-0 bg-gray-500 bg-opacity-75"
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
