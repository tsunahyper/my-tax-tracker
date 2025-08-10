import React, { useState, useRef } from 'react';
import { ArrowUpTrayIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { PhotoIcon, DocumentIcon } from '@heroicons/react/24/solid';
import { ReceiptReviewTable } from '../components/ReceiptReview';
import Navbar from '../components/Navbar';
import uploadFile from '../customprocess/uploadProgress';

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const ReceiptManagement = () => {
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef();
  const [refreshKey, setRefreshKey] = useState(0);

  // Helper to animate progress
  const animateProgress = (fileName, from, to, duration = 1000) => {
    const start = Date.now();
    const step = () => {
      const now = Date.now();
      const elapsed = now - start;
      const progress = Math.min(from + ((to - from) * (elapsed / duration)), to);
      setFiles(prev =>
        prev.map(f =>
          f.name === fileName
            ? { ...f, progress, status: progress === 100 ? 'completed' : f.status }
            : f
        )
      );
      if (progress < to) {
        requestAnimationFrame(step);
      }
    };
    step();
  };

  // Handle multiple files
  const handleFiles = (fileList) => {
    Array.from(fileList).forEach(file => {
      // Generate a unique identifier for the file to allow duplicates
      const fileId = `${file.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      setFiles(prev => [
        ...prev,
        {
          id: fileId,
          name: file.name,
          size: formatFileSize(file.size),
          progress: 0,
          speed: '',
          icon: file.type.startsWith('image') ? PhotoIcon : DocumentIcon,
          status: 'uploading'
        }
      ]);

      const startTime = Date.now();
      let lastProgress = 0;

      uploadFile(file, (percentCompleted, progressEvent) => {
        if (percentCompleted < 100) {
          lastProgress = percentCompleted;
          setFiles(prev =>
            prev.map(f =>
              f.id === fileId
                ? { ...f, progress: percentCompleted, status: 'uploading' }
                : f
            )
          );
        }
      })
        .then(res => {
          // Animate to 100% if upload was too fast
          const elapsed = Date.now() - startTime;
          const minDuration = 1200;
          const remaining = Math.max(minDuration - elapsed, 300);
          animateProgress(file.name, lastProgress, 100, remaining);
          setRefreshKey(prev => prev + 1); // trigger refresh
          
          // Clear the file input after successful upload
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        })
        .catch(err => {
          setFiles(prev =>
            prev.map(f =>
              f.id === fileId
                ? { ...f, status: 'failed' }
                : f
            )
          );
          console.error('Upload failed:', err);
          
          // Clear the file input after failed upload
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        });
    });
  };

  const handleFileChange = (e) => {
    handleFiles(e.target.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <>
      <Navbar />
      <div className='bg-gradient-to-br from-blue-400 to-blue-900 dashboard-app p-slate-300 min-h-screen'>
        <div className='flex flex-col md:flex-row gap-6 items-center justify-center'>
          {/* Upload Card */}
          <div className='mt-10 bg-gray-200 w-full md:w-1/2 lg:w-1/3 rounded-lg shadow p-6 flex flex-col items-center'>
            <h1 className='text-xl font-bold mb-6 drop-shadow text-center'>Upload New Receipt</h1>
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center border-2 border-dotted border-blue-400 rounded-lg w-full py-8 mb-6 bg-white cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <ArrowUpTrayIcon className="h-10 w-10 text-black mb-2" />
              <p className="text-gray-700 font-medium">Drag files to upload or click here</p>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileChange}
                ref={fileInputRef}
                multiple
                accept="image/*,.pdf,.doc,.docx"
              />
            </label>
            <button
              className="bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-600 transition"
              onClick={() => fileInputRef.current.click()}
            >
              Choose File
            </button>
          </div>
          {/* Arrow */}
          <ArrowRightIcon className='h-10 w-10 text-green-300 hidden md:block' />
          {/* Uploading Card Progression*/}
          <div className='bg-gray-200 w-full md:w-1/2 lg:w-2/5 rounded-lg shadow p-6 flex flex-col'>
            <h1 className='text-xl font-bold mb-6 text-center'>Uploaded Files</h1>
            <div className="flex flex-col gap-4">
              {files.length === 0 ? (
                <div className="text-center text-gray-500 py-4">No file uploaded</div>
              ) : (
                files.map((file) => (
                  <div key={file.id} className="flex items-center gap-4 border-b pb-2 last:border-b-0">
                    <file.icon className="h-10 w-10 text-gray-700" />
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">{file.name}</span>
                        <span className="text-sm text-gray-500">{file.size}</span>
                      </div>
                      <div className="w-full bg-gray-300 rounded-full h-2 mt-1 mb-1">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${file.status === "completed" ? "bg-green-500" : "bg-blue-400"}`}
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span>
                          {file.status === "completed"
                            ? <span className="text-green-600 font-semibold">Completed</span>
                            : `${Math.round(file.progress)}% Done`}
                        </span>
                        <span className="text-gray-500">{file.speed}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        {/* Receipt Review Table */}
        <ReceiptReviewTable refreshKey={refreshKey} />
      </div>
    </>
  );
};

export default ReceiptManagement;