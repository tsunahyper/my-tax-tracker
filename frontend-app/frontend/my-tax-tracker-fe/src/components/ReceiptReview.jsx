import React, { useEffect, useState, useCallback } from "react";
import { BsThreeDots } from 'react-icons/bs';
import { EyeIcon, PencilIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from "../customprocess/auth";
import { useClickOutside } from "../customprocess/clickOutside";
import ViewReceipt from "../pages/ViewReceipt";

// Helper to convert camelCase to Title Case
function camelToTitle(str) {
  if (!str) return '';
  return str
    .replace(/([A-Z])/g, ' $1') // insert space before capital letters
    .replace(/^./, (s) => s.toUpperCase()) // capitalize first letter
    .trim();
}

function formatFileSize(bytes) {
  if (!bytes || isNaN(bytes)) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// Pagination component
function Pagination({ currentPage, totalPages, onPageChange }) {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages around current page
      let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let end = Math.min(totalPages, start + maxVisiblePages - 1);
      
      // Adjust start if we're near the end
      if (end === totalPages) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center space-x-1 mt-6">
      {/* Previous button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        <span className="hidden sm:inline ml-1">Previous</span>
      </button>
      
      {/* Page numbers */}
      {getPageNumbers().map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-2 text-sm font-medium border border-gray-300 ${
            page === currentPage
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          {page}
        </button>
      ))}
      
      {/* Next button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="hidden sm:inline mr-1">Next</span>
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ReceiptReviewTable({ refreshKey }) {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [selectedReceiptId, setSelectedReceiptId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingReceiptId, setDeletingReceiptId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    const url = `${API_BASE_URL}/receipts/view`;
    fetchWithAuth(url)
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        setReceipts(Array.isArray(data) ? data : []);
        setLoading(false);
        // Reset to first page when data changes
        setCurrentPage(1);
      })
      .catch((err) => {
        setError('Failed to fetch receipts');
        setLoading(false);
      });
  }, [API_BASE_URL, refreshKey]);

  // Calculate pagination values
  const totalPages = Math.ceil(receipts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentReceipts = receipts.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Close any open dropdowns when changing pages
    setOpenDropdownId(null);
  };

  const handleDropdownToggle = (receiptId) => {
    setOpenDropdownId(openDropdownId === receiptId ? null : receiptId);
  };

  const handleViewReceipt = (receiptId) => {
    setOpenDropdownId(null);
    setSelectedReceiptId(receiptId);
    setIsModalOpen(true);
  };

  const handleReviewReceipt = (receiptId) => {
    setOpenDropdownId(null);
    navigate(`/review-receipt/${receiptId}`);
  };

  const handleDeleteReceipt = async (receiptId) => {
    if (!window.confirm('Are you sure you want to delete this receipt? This action cannot be undone.')) {
      return;
    }

    setDeletingReceiptId(receiptId);
    setOpenDropdownId(null);

    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/receipts/delete/${receiptId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete receipt');
      }

      // Remove the deleted receipt from the state
      setReceipts(prevReceipts => prevReceipts.filter(receipt => receipt.receipt_id !== receiptId));
      
      // Adjust current page if we're on the last page and it becomes empty
      const newTotalPages = Math.ceil((receipts.length - 1) / ITEMS_PER_PAGE);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
      
      // You could also trigger a refresh of the parent component if needed
      if (typeof refreshKey === 'function') {
        refreshKey();
      }
    } catch (error) {
      console.error('Error deleting receipt:', error);
      alert('Failed to delete receipt. Please try again.');
    } finally {
      setDeletingReceiptId(null);
    }
  };

  const handleUpdateStatus = (receiptId) => {
    setOpenDropdownId(null);
    // Add your update status logic here
    console.log('Update status for receipt:', receiptId);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedReceiptId(null);
  };

  // Click outside callback
  const handleClickOutside = useCallback(() => {
    setOpenDropdownId(null);
  }, []);

  // Use the click outside hook
  const dropdownRef = useClickOutside(handleClickOutside);

  return (
    <>
      <div className="bg-gray-200 rounded-xl shadow p-4 sm:p-6 mt-10 w-full max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-bold drop-shadow">Receipt Review</h2>
          {!loading && receipts.length > 0 && (
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1}-{Math.min(endIndex, receipts.length)} of {receipts.length} receipts
            </div>
          )}
        </div>
        
        {loading && <div>Loading...</div>}
        {error && <div className="text-red-500">{error}</div>}
        
        {/* Desktop table view */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-gray-400">
                <th className="py-2 px-2 sm:px-4 font-semibold">Receipt Name</th>
                <th className="py-2 px-2 sm:px-4 font-semibold">Receipt Size</th>
                <th className="py-2 px-2 sm:px-4 font-semibold">Receipt Status</th>
                <th className="py-2 px-2 sm:px-4 font-semibold">Uploaded At</th>
                <th className="py-2 px-2 sm:px-4 font-semibold text-center">More Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentReceipts.map((r) => (
                <tr key={r.receipt_id} className="border-b border-gray-300 last:border-b-0 hover:bg-gray-50">
                  <td className="py-2 px-2 sm:px-4">{r.receipt_filename}</td>
                  <td className="py-2 px-2 sm:px-4">
                    {r.receipt_size ? formatFileSize(Number(r.receipt_size)) : '-'}
                  </td>
                  <td className={`py-2 px-2 sm:px-4 font-semibold ${
                    r.receipt_status === "pending"
                      ? "text-yellow-600"
                      : r.receipt_status === "approved"
                      ? "text-green-600"
                      : "text-gray-600"
                  }`}>
                    {camelToTitle(r.receipt_status)}
                  </td>
                  <td className="py-2 px-2 sm:px-4">
                    {r.receipt_upload_datetime ? new Date(r.receipt_upload_datetime).toLocaleString() : '-'}
                  </td>
                  <td className="py-2 px-2 sm:px-4 flex justify-center items-center relative">
                    <BsThreeDots 
                      className="h-4 w-4 text-gray-500 hover:text-gray-700 cursor-pointer" 
                      onClick={() => handleDropdownToggle(r.receipt_id)} 
                    />
                    {openDropdownId === r.receipt_id && (
                      <div 
                        ref={dropdownRef}
                        className="absolute right-0 mt-2 w-36 sm:w-44 bg-white rounded-md shadow-lg z-10 border border-gray-200"
                      >
                        <button 
                          className="flex items-center w-full px-3 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100"
                          onClick={() => handleReviewReceipt(r.receipt_id)}
                        >
                          <PencilIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mr-2 flex-shrink-0" />
                          <span className="truncate">Review Receipt</span>
                        </button>
                        <button 
                          className={`flex items-center w-full px-3 py-2 text-xs sm:text-sm border-b border-gray-100 ${
                            r.receipt_status === "pending"
                              ? "text-gray-400 cursor-not-allowed bg-gray-50"
                              : "text-gray-700 hover:bg-gray-50 cursor-pointer"
                          }`}
                          onClick={() => r.receipt_status !== "pending" && handleViewReceipt(r.receipt_id)}
                          disabled={r.receipt_status === "pending"}
                        >
                          <EyeIcon className={`h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0 ${
                            r.receipt_status === "pending" ? "text-gray-300" : "text-gray-400"
                          }`} />
                          <span className="truncate">View Receipt</span>
                        </button>
                        <button 
                          className={`flex items-center w-full px-3 py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50 ${
                            deletingReceiptId === r.receipt_id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                          }`}
                          onClick={() => deletingReceiptId !== r.receipt_id && handleDeleteReceipt(r.receipt_id)}
                          disabled={deletingReceiptId === r.receipt_id}
                        >
                          <TrashIcon className={`h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0 ${
                            deletingReceiptId === r.receipt_id ? 'text-red-300' : 'text-red-500'
                          }`} />
                          <span className="truncate">
                            {deletingReceiptId === r.receipt_id ? 'Deleting...' : 'Delete Receipt'}
                          </span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile card view */}
        <div className="sm:hidden space-y-3">
          {currentReceipts.map((r) => (
            <div key={r.receipt_id} className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0 mr-3">
                  <h3 className="font-semibold text-sm truncate" title={r.receipt_filename}>
                    {r.receipt_filename}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {r.receipt_size ? formatFileSize(Number(r.receipt_size)) : 'No size'}
                  </p>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                    r.receipt_status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : r.receipt_status === "approved"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {camelToTitle(r.receipt_status)}
                  </span>
                  <BsThreeDots 
                    className="h-4 w-4 text-gray-500 hover:text-gray-700 cursor-pointer flex-shrink-0" 
                    onClick={() => handleDropdownToggle(r.receipt_id)} 
                  />
                </div>
              </div>
              
              <p className="text-xs text-gray-600 mb-3">
                {r.receipt_upload_datetime ? new Date(r.receipt_upload_datetime).toLocaleString() : 'No date'}
              </p>

              {/* Always show buttons for testing */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex space-x-2 mb-2">
                  <button 
                    type="button"
                    className="flex-1 flex items-center justify-center px-3 py-2 text-xs bg-blue-600 text-white rounded-md"
                    onClick={() => handleReviewReceipt(r.receipt_id)}
                  >
                    <PencilIcon className="h-3 w-3 mr-1" />
                    Review
                  </button>
                  <button 
                    type="button"
                    className={`flex-1 flex items-center justify-center px-3 py-2 text-xs rounded-md ${
                      r.receipt_status === "pending"
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-gray-600 text-white"
                    }`}
                    onClick={() => r.receipt_status !== "pending" && handleViewReceipt(r.receipt_id)}
                    disabled={r.receipt_status === "pending"}
                  >
                    <EyeIcon className="h-3 w-3 mr-1" />
                    View
                  </button>
                </div>
                <button 
                  type="button"
                  className="w-full flex items-center justify-center px-3 py-2 text-xs bg-red-600 text-white rounded-md"
                  onClick={() => handleDeleteReceipt(r.receipt_id)}
                >
                  <TrashIcon className="h-3 w-3 mr-1" />
                  Delete Receipt
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />

        {(!loading && receipts.length === 0) && (
          <div className="text-center text-gray-500 py-4">No receipts found.</div>
        )}
      </div>

      {/* Receipt Modal */}
      <ViewReceipt 
        receiptId={selectedReceiptId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}