import React, { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { fetchWithAuth } from "../customprocess/auth";

const ViewReceipt = ({ receiptId, isOpen, onClose }) => {
    const [receiptImage, setReceiptImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        if (isOpen && receiptId) {
            const fetchReceipt = async () => {
                setLoading(true);
                setError(null);
                try {
                    const response = await fetchWithAuth(`${API_BASE_URL}/receipts/image/${receiptId}`);
                    if (!response.ok) {
                        throw new Error('No receipt found');
                    }
                    
                    const blob = await response.blob();
                    const imageUrl = URL.createObjectURL(blob);
                    setReceiptImage(imageUrl);
                    setLoading(false);
                } catch (error) {
                    setError('Failed to load receipt');
                    setLoading(false);
                }
            };

            fetchReceipt();
        }

        // Cleanup blob URL when modal closes
        return () => {
            if (receiptImage) {
                URL.revokeObjectURL(receiptImage);
                setReceiptImage(null);
            }
        };
    }, [isOpen, receiptId, API_BASE_URL]);

    // Handle click outside to close modal
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
            onClick={handleBackdropClick}
        >
            <div className="relative w-full max-w-md sm:max-w-lg lg:max-w-xl h-full max-h-[90vh] flex flex-col">
                {/* Header with close button */}
                <div className="flex justify-between items-center mb-2 px-2">
                    <div className="text-white text-sm font-medium">View Receipt</div>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-gray-300 p-1 rounded-full hover:bg-white hover:bg-opacity-10 transition-colors"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                
                {/* Receipt container with scroll */}
                <div className="bg-white rounded-lg shadow-lg flex-1 overflow-hidden">
                    {loading && (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-gray-600">Loading receipt...</div>
                        </div>
                    )}
                    
                    {error && (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-red-500">{error}</div>
                        </div>
                    )}
                    
                    {receiptImage && (
                        <div className="h-full overflow-auto">
                            <div className="p-4">
                                <img 
                                    src={receiptImage} 
                                    alt="Receipt" 
                                    className="w-full h-auto min-w-full"
                                    style={{ 
                                        imageRendering: 'crisp-edges',
                                        maxWidth: 'none'
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ViewReceipt;