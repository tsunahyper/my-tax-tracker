import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, CheckIcon, XMarkIcon, PlusIcon, TrashIcon, EyeIcon, PencilIcon } from '@heroicons/react/24/outline';
import { fetchWithAuth } from "../customprocess/auth";

const ReviewReceipt = () => {
  const { receiptId } = useParams();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState(null);
  const [receiptImage, setReceiptImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingTextractData, setEditingTextractData] = useState({});
  const [fieldOrder, setFieldOrder] = useState([]); // Track field order
  const [isSaving, setIsSaving] = useState(false);
  const [statusChanged, setStatusChanged] = useState(false);
  const [newStatus, setNewStatus] = useState(null);
  const [editingKey, setEditingKey] = useState(null);
  const [editingKeyValue, setEditingKeyValue] = useState('');
  const [showRejectWarning, setShowRejectWarning] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Check if receipt is approved (read-only mode)
  const isReadOnly = receipt?.receipt_status === 'approved';

  useEffect(() => {
    const fetchReceiptData = async () => {
      try {
        // Fetch receipt details
        const detailsResponse = await fetchWithAuth(`${API_BASE_URL}/receipts/view/${receiptId}`);
        if (!detailsResponse.ok) throw new Error('Failed to fetch receipt details');
        const detailsData = await detailsResponse.json();
        setReceipt(detailsData);
        
        const textractData = detailsData.textract_data || {};
        setEditingTextractData(textractData);
        // Initialize field order with existing keys
        setFieldOrder(Object.keys(textractData));

        // Fetch receipt image
        const imageResponse = await fetchWithAuth(`${API_BASE_URL}/receipts/image/${receiptId}`);
        if (imageResponse.ok) {
          const blob = await imageResponse.blob();
          const imageUrl = URL.createObjectURL(blob);
          setReceiptImage(imageUrl);
        }

        setLoading(false);
      } catch (error) {
        setError('Failed to load receipt data');
        setLoading(false);
      }
    };

    if (receiptId) {
      fetchReceiptData();
    }

    return () => {
      if (receiptImage) {
        URL.revokeObjectURL(receiptImage);
      }
    };
  }, [receiptId, API_BASE_URL]);

  const handleTextractDataChange = (oldKey, newKey, value) => {
    if (isReadOnly) return; // Prevent changes in read-only mode
    
    setEditingTextractData(prev => {
      const newData = { ...prev };
      
      // If key is being changed, remove old key and add new one
      if (oldKey !== newKey) {
        delete newData[oldKey];
        newData[newKey] = value;
      } else {
        // Just update the value
        newData[newKey] = value;
      }
      
      return newData;
    });

    // Update field order when key changes
    if (oldKey !== newKey) {
      setFieldOrder(prev => {
        const newOrder = [...prev];
        const index = newOrder.indexOf(oldKey);
        if (index !== -1) {
          newOrder[index] = newKey;
        }
        return newOrder;
      });
    }
  };

  const handleAddNewField = () => {
    if (isReadOnly) return; // Prevent adding fields in read-only mode
    
    const newKey = `new_field_${Object.keys(editingTextractData).length + 1}`;
    setEditingTextractData(prev => ({
      ...prev,
      [newKey]: ''
    }));
    setFieldOrder(prev => [...prev, newKey]);
  };

  const handleRemoveField = (key) => {
    if (isReadOnly) return; // Prevent removing fields in read-only mode
    
    setEditingTextractData(prev => {
      const newData = { ...prev };
      delete newData[key];
      return newData;
    });
    setFieldOrder(prev => prev.filter(k => k !== key));
  };

  const handleKeyEdit = (key) => {
    if (isReadOnly) return;
    setEditingKey(key);
    setEditingKeyValue(key);
  };

  const handleKeyEditComplete = (oldKey) => {
    if (isReadOnly) return;
    
    const newKey = editingKeyValue.trim();
    
    // Don't allow empty field names
    if (!newKey) {
      setEditingKey(null);
      setEditingKeyValue('');
      return;
    }
    
    if (oldKey !== newKey) {
      const value = editingTextractData[oldKey];
      handleTextractDataChange(oldKey, newKey, value);
    }
    
    setEditingKey(null);
    setEditingKeyValue('');
  };

  const handleKeyEditCancel = () => {
    setEditingKey(null);
    setEditingKeyValue('');
  };

  const handleSaveChanges = async () => {
    if (isReadOnly) return; // Prevent saving in read-only mode
    
    setIsSaving(true);
    try {
      // Save textract data changes
      const textractResponse = await fetchWithAuth(`${API_BASE_URL}/receipts/update/${receiptId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          textract_data: editingTextractData
        }),
      });

      if (!textractResponse.ok) throw new Error('Failed to update receipt data');

      // Save status changes if any
      if (statusChanged && newStatus) {
        const statusResponse = await fetchWithAuth(`${API_BASE_URL}/receipts/status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            receipt_id: receiptId,
            new_status: newStatus
          }),
        });

        if (!statusResponse.ok) throw new Error('Failed to update status');
      }
      
      // Refresh the receipt data
      const updatedResponse = await fetchWithAuth(`${API_BASE_URL}/receipts/view/${receiptId}`);
      const updatedData = await updatedResponse.json();
      setReceipt(updatedData);
      const textractData = updatedData.textract_data || {};
      setEditingTextractData(textractData);
      setFieldOrder(Object.keys(textractData));
      setStatusChanged(false);
      setNewStatus(null);
      
      alert('Receipt updated successfully!');
    } catch (error) {
      alert('Failed to update receipt');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = (status) => {
    if (isReadOnly) return; // Prevent status changes in read-only mode
    
    if (status === 'rejected') {
      setShowRejectWarning(true);
      return;
    }
    
    setNewStatus(status);
    setStatusChanged(true);
  };

  const handleRejectConfirm = async () => {
    setIsSaving(true);
    try {
      // Delete the receipt entirely
      const deleteResponse = await fetchWithAuth(`${API_BASE_URL}/receipts/delete/${receiptId}`, {
        method: 'DELETE',
      });

      if (!deleteResponse.ok) throw new Error('Failed to delete receipt');

      setShowRejectWarning(false);
      alert('Receipt has been permanently deleted.');
      navigate('/receipt'); // Navigate back to receipt management
    } catch (error) {
      alert('Failed to delete receipt. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRejectCancel = () => {
    setShowRejectWarning(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading receipt...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Receipt not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="mr-4 p-2 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                {isReadOnly ? 'View Receipt' : 'Review Receipt'}
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              {isReadOnly && (
                <div className="flex items-center text-blue-600">
                  <EyeIcon className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">Read Only</span>
                </div>
              )}
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                receipt.receipt_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                receipt.receipt_status === 'approved' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {receipt.receipt_status?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          {/* Left Panel - Receipt Image */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 order-2 lg:order-1">
            <h2 className="text-lg font-semibold mb-4">Receipt Image</h2>
            {receiptImage ? (
              <div className="overflow-auto max-h-64 sm:max-h-96">
                <img 
                  src={receiptImage} 
                  alt="Receipt" 
                  className="w-full h-auto"
                  style={{ imageRendering: 'crisp-edges' }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-500">
                No image available
              </div>
            )}
          </div>

          {/* Right Panel - Editable/Read-only Textract Data */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 order-1 lg:order-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {isReadOnly ? 'Extracted Data (Read Only)' : 'Extracted Data'}
              </h2>
              {!isReadOnly && (
                <button
                  onClick={handleAddNewField}
                  className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Field
                </button>
              )}
            </div>
            
            <div className="space-y-4 max-h-64 sm:max-h-96 overflow-y-auto">
              {fieldOrder.map((key) => {
                const value = editingTextractData[key];
                if (value === undefined) return null; // Skip if field was removed
                
                return (
                  <div key={key} className="relative">
                    {/* Field Name - Clickable to edit */}
                    <div className="mb-1">
                      {editingKey === key ? (
                        <input
                          type="text"
                          value={editingKeyValue}
                          onChange={(e) => setEditingKeyValue(e.target.value)}
                          onBlur={() => handleKeyEditComplete(key)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleKeyEditComplete(key);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              handleKeyEditCancel();
                            }
                          }}
                          className="text-xs font-medium text-gray-600 px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          autoFocus
                        />
                      ) : (
                        <div 
                          className={`text-xs font-medium text-gray-600 px-1 py-0.5 cursor-pointer hover:bg-gray-50 rounded ${
                            !isReadOnly ? 'hover:border hover:border-gray-300' : ''
                          }`}
                          onClick={() => handleKeyEdit(key)}
                        >
                          {key}
                          {!isReadOnly && (
                            <PencilIcon className="inline h-3 w-3 ml-1 text-gray-400" />
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Value Input */}
                    <div className="flex items-center space-x-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={value || ''}
                          onChange={(e) => handleTextractDataChange(key, key, e.target.value)}
                          disabled={isReadOnly}
                          className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isReadOnly 
                              ? 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed' 
                              : 'border-gray-300'
                          }`}
                        />
                      </div>
                      {!isReadOnly && (
                        <button
                          onClick={() => handleRemoveField(key)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {fieldOrder.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <p className="text-sm">No extracted data available.</p>
                  {!isReadOnly && (
                    <p className="text-xs text-gray-400">Click "Add Field" to add data manually.</p>
                  )}
                </div>
              )}
            </div>

            {/* Receipt Info */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-md font-semibold mb-3">Receipt Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div>
                  <span className="font-medium text-gray-700">Filename:</span>
                  <p className="text-gray-600 truncate">{receipt.receipt_filename}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Upload Date:</span>
                  <p className="text-gray-600">
                    {receipt.receipt_upload_datetime ? 
                      new Date(receipt.receipt_upload_datetime).toLocaleDateString() : 
                      'N/A'
                    }
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">File Size:</span>
                  <p className="text-gray-600">
                    {receipt.receipt_size ? 
                      `${(receipt.receipt_size / 1024).toFixed(1)} KB` : 
                      'N/A'
                    }
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <p className="text-gray-600">{receipt.receipt_status?.toUpperCase()}</p>
                </div>
              </div>
            </div>

            {/* Status Buttons - Only show for pending receipts and not in read-only mode */}
            {receipt.receipt_status === 'pending' && !isReadOnly && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-md font-semibold mb-3">Update Status</h3>
                
                {/* Reject Warning Disclaimer */}
                {showRejectWarning && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <XMarkIcon className="h-5 w-5 text-red-400" />
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-red-800">Warning: Permanent Deletion</h4>
                        <p className="text-sm text-red-700 mt-1">
                          Rejecting this receipt will permanently delete it from the system. 
                          This action cannot be undone and will remove both the image and database record.
                        </p>
                        <div className="mt-3 flex space-x-3">
                          <button
                            onClick={handleRejectConfirm}
                            disabled={isSaving}
                            className="px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSaving ? 'Deleting...' : 'Yes, Delete Permanently'}
                          </button>
                          <button
                            onClick={handleRejectCancel}
                            disabled={isSaving}
                            className="px-3 py-2 text-sm bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleStatusChange('approved')}
                    disabled={isSaving || showRejectWarning}
                    className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed ${
                      newStatus === 'approved' 
                        ? 'bg-green-700 text-white' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Approve
                  </button>
                  
                  <button
                    onClick={() => handleStatusChange('rejected')}
                    disabled={isSaving || showRejectWarning}
                    className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed ${
                      newStatus === 'rejected' 
                        ? 'bg-red-700 text-white' 
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    <XMarkIcon className="h-4 w-4 mr-2" />
                    Reject
                  </button>
                </div>
              </div>
            )}

            {/* Save Button - Only show if status changed and not in read-only mode */}
            {statusChanged && !isReadOnly && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReviewReceipt