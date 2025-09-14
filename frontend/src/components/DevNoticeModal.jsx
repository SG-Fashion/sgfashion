// src/components/DevNoticeModal.jsx
import React, { useEffect } from 'react';

const DevNoticeModal = ({ open, onClose }) => {
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        onClose();
      }, 10000); // 10 seconds

      return () => clearTimeout(timer); // cleanup when closed/unmounted
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-4">
        <h2 className="text-xl font-semibold mb-4">🚧 Under Development</h2>
        <p className="mb-6">
          This website is still in active development, it may take up to 30 seconds for the products to load, and may be buggy in places.  
          However, we have perfected the flow of orders to be smooth!
        </p>
        <button
          onClick={onClose}
          className="mt-2 px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default DevNoticeModal;
