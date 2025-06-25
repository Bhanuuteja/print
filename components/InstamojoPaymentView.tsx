import React, { useState } from 'react';

interface InstamojoPaymentViewProps {
  cost: number;
  onSuccess: () => void;
  onError: (message: string) => void;
}

const InstamojoPaymentView: React.FC<InstamojoPaymentViewProps> = ({ cost, onSuccess, onError }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProceed = () => {
    setIsProcessing(true);
    setTimeout(() => {
      if (onSuccess) onSuccess();
      setIsProcessing(false);
    }, 1500); // Simulate processing delay
  };
  return (
    <div className="p-1 text-center">
      <h2 className="text-2xl font-semibold text-textPrimary mb-6">Ready to Print?</h2>
      <div className="bg-primary-dark text-white p-6 rounded-lg shadow-lg mb-6">
        <div className="flex justify-between items-center">
          <span className="text-lg">Total Amount Due:</span>
          <span className="text-3xl font-bold flex items-center">₹{cost.toFixed(2)}</span>
        </div>
      </div>
      <div className="text-center mb-6">
        <p className="text-textSecondary text-sm">
          <span className="font-semibold text-textPrimary">Is it okay to proceed for the print?</span>
        </p>
      </div>
      <button
        onClick={handleProceed}
        disabled={isProcessing}
        className={`w-full flex items-center justify-center bg-secondary hover:bg-secondary-hover text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-opacity-50 ${isProcessing ? 'opacity-60 cursor-not-allowed' : ''}`}
        aria-label="Proceed to print"
      >
        {isProcessing ? (
          <>
            <span className="loader mr-2"></span> Processing...
          </>
        ) : (
          'Yes, Proceed to Print'
        )}
      </button>
      {isProcessing && (
        <div className="mt-4 flex justify-center items-center">
          <span className="loader mr-2"></span>
          <span className="text-textSecondary">Processing your request...</span>
        </div>
      )}
    </div>
  );
};

export default InstamojoPaymentView;
