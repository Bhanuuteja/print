import React, { useState, useEffect, useCallback } from 'react';
import { AppStep, PrintJob } from './types';
import { PRICE_PER_PAGE, DEFAULT_COPIES, DEFAULT_ORIENTATION, DEFAULT_COLOR_MODE, DEFAULT_DUPLEX_MODE, LOCAL_STORAGE_PRINTER_BUSY_KEY, PRINTER_BUSY_DURATION_MS } from './constants';
import FileUpload from './components/FileUpload';
import FileDetailsView from './components/FileDetailsView';
import Spinner from './components/Spinner';
import { PrinterIcon, AlertTriangleIcon, CheckCircleIcon, UploadCloudIcon, RefreshCwIcon, FileTextIcon } from './components/Icons';
import { UPIPayment } from './components/UPIPayment';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.INITIAL_CHECK);
  const [printJob, setPrintJob] = useState<PrintJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [printerBusyUntil, setPrinterBusyUntil] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false); // Used for file processing, initial check
  const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(false); // Specific for refresh button

  const checkPrinterStatus = useCallback((isManualRefresh = false) => {
    if (isManualRefresh) setIsCheckingStatus(true);
    else setIsLoading(true); // For initial check

    // Simulate a short delay for checking status
    setTimeout(() => {
      const busyUntilStr = localStorage.getItem(LOCAL_STORAGE_PRINTER_BUSY_KEY);
      let busyTime: number | null = null;
      if (busyUntilStr) {
        busyTime = parseInt(busyUntilStr, 10);
        if (busyTime <= Date.now()) {
          localStorage.removeItem(LOCAL_STORAGE_PRINTER_BUSY_KEY); // Expired
          busyTime = null;
        }
      }
      setPrinterBusyUntil(busyTime);

      if (busyTime) {
        setCurrentStep(AppStep.WAITING);
      } else {
        setCurrentStep(AppStep.UPLOAD);
      }
      
      if (isManualRefresh) setIsCheckingStatus(false);
      else setIsLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    checkPrinterStatus(); // Initial check

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === LOCAL_STORAGE_PRINTER_BUSY_KEY || event.key === null) // null if localStorage.clear() was called
        checkPrinterStatus();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [checkPrinterStatus]);

  useEffect(() => {
    let timerId: number | null = null;
    if (currentStep === AppStep.WAITING && printerBusyUntil) {
      const check = () => {
        if (Date.now() >= printerBusyUntil) {
          checkPrinterStatus(); 
        } else {
          // Force re-render to update countdown if displaying it
          setPrinterBusyUntil(prev => prev); 
        }
      };
      timerId = window.setInterval(check, 1000);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [currentStep, printerBusyUntil, checkPrinterStatus]);


  const handleFileProcessed = (jobDetails: { file: File, fileName: string, pageCount: number }) => {
    const newPrintJob: PrintJob = {
      ...jobDetails,
      copies: DEFAULT_COPIES,
      orientation: DEFAULT_ORIENTATION,
      colorMode: DEFAULT_COLOR_MODE,
      duplexMode: DEFAULT_DUPLEX_MODE,
      cost: jobDetails.pageCount * PRICE_PER_PAGE * DEFAULT_COPIES,
    };
    setPrintJob(newPrintJob);
    setError(null);
    setCurrentStep(AppStep.CONFIRM_DETAILS);
    setIsLoading(false); // isLoading was set by FileUpload
  };

  const handleProcessingError = (errorMessage: string) => {
    setError(errorMessage);
    setPrintJob(null);
    setCurrentStep(AppStep.UPLOAD);
    setIsLoading(false); // isLoading was set by FileUpload
  };

  const handleConfirmDetails = (confirmedJob: PrintJob) => {
    if (!confirmedJob) return;
    setIsLoading(true); // Simulate submission loading
    setError(null);
    
    // Simulate job submission and making printer busy
    setTimeout(() => {
      const busyUntilTime = Date.now() + PRINTER_BUSY_DURATION_MS;
      localStorage.setItem(LOCAL_STORAGE_PRINTER_BUSY_KEY, busyUntilTime.toString());
      
      setPrintJob(confirmedJob);
      setPrinterBusyUntil(busyUntilTime);
      setCurrentStep(AppStep.PAYMENT);
      setIsLoading(false);
    }, 1000); // Simulate network delay
  };

  const handlePaymentSuccess = async () => {
    if (!printJob) return;
    setIsLoading(true);
    setError(null);

    // Prepare FormData
    const formData = new FormData();
    formData.append('file', printJob.file, printJob.fileName);
    formData.append('fileName', printJob.fileName);
    formData.append('pageCount', String(printJob.pageCount));
    formData.append('cost', String(printJob.cost));
    formData.append('copies', String(printJob.copies));
    formData.append('orientation', printJob.orientation);
    formData.append('colorMode', printJob.colorMode);
    formData.append('duplexMode', printJob.duplexMode);

    try {
      const response = await fetch('/api/print', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setCurrentStep(AppStep.PRINTING);
      } else {
        setError(data.error || 'Failed to send print job.');
      }
    } catch (err) {
      setError('Network or server error while sending print job.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleStartNewJob = () => {
    // No need to setIsLoading here unless we add a delay for clearing
    localStorage.removeItem(LOCAL_STORAGE_PRINTER_BUSY_KEY);
    setPrintJob(null);
    setError(null);
    setPrinterBusyUntil(null);
    setCurrentStep(AppStep.UPLOAD); // Go to upload after clearing
  };

  const handlePrintComplete = () => {
    setCurrentStep(AppStep.THANK_YOU);
    setError(null);
  };

  const renderStep = () => {
    if (isLoading && currentStep === AppStep.PAYMENT) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <Spinner />
          <p className="mt-4 text-lg text-textSecondary">Sending your document to the printer. Please wait...</p>
        </div>
      );
    }
    if (isLoading && (currentStep === AppStep.INITIAL_CHECK || (isLoading && printJob === null && currentStep === AppStep.UPLOAD) || currentStep === AppStep.CONFIRM_DETAILS )) {
        let message = "Processing...";
        if (currentStep === AppStep.INITIAL_CHECK) message = "Checking printer status...";
        else if (currentStep === AppStep.CONFIRM_DETAILS) message = "Submitting your print job...";
        else if (currentStep === AppStep.UPLOAD && isLoading && printJob === null) message = "Processing file..."; // Handled by FileUpload's internal spinner
        
        // General loading for initial check or job submission
        if(currentStep === AppStep.INITIAL_CHECK || currentStep === AppStep.CONFIRM_DETAILS) {
            return <div className="flex flex-col items-center justify-center h-full"><Spinner /><p className="mt-4 text-lg text-textSecondary">{message}</p></div>;
        }
    }


    switch (currentStep) {
      case AppStep.INITIAL_CHECK: // Covered by isLoading above
        return <div className="flex flex-col items-center justify-center h-full"><Spinner /><p className="mt-4 text-lg text-textSecondary">Checking printer status...</p></div>;
      case AppStep.WAITING:
        const timeLeft = printerBusyUntil ? Math.max(0, Math.ceil((printerBusyUntil - Date.now()) / 1000)) : 0;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        return (
          <div className="text-center p-8 bg-surface shadow-xl rounded-lg">
            <PrinterIcon className="w-16 h-16 text-warning mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-textPrimary mb-2">Printer Busy</h2>
            <p className="text-textSecondary mb-4">Another print job is in progress. Please wait.</p>
            {timeLeft > 0 && (
              <p className="text-lg font-medium text-primary">
                Available in approximately: {minutes}m {seconds}s
              </p>
            )}
             <div className="flex justify-center mt-6">
               <button
                onClick={() => checkPrinterStatus(true)}
                disabled={isCheckingStatus}
                className="flex items-center justify-center bg-primary hover:bg-primary-hover text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 disabled:opacity-70"
              >
                {isCheckingStatus ? <Spinner size="sm" color="text-white"/> : <RefreshCwIcon className="w-5 h-5" />}
                <span className="ml-2">{isCheckingStatus ? "Checking..." : "Refresh Status"}</span>
              </button>
            </div>
          </div>
        );
      case AppStep.UPLOAD:
        return <FileUpload onFileProcessed={handleFileProcessed} onError={handleProcessingError} setIsLoading={(fileProcessing) => setIsLoading(fileProcessing && currentStep === AppStep.UPLOAD)} />;
      case AppStep.CONFIRM_DETAILS:
        if (!printJob) return <p>Error: No print job data. Please <button onClick={handleStartNewJob} className="text-primary underline">start over</button>.</p>;
        return (
          <FileDetailsView
            job={printJob}
            onConfirm={handleConfirmDetails}
            onCancel={handleStartNewJob}
          />
        );
      case AppStep.PAYMENT:
        if (!printJob) return <p>Error: No print job data. Please <button onClick={handleStartNewJob} className="text-primary underline">start over</button>.</p>;
        return (
          <UPIPayment
            upiId="7993685469@ybl"
            name="Meena Store"
            amount={printJob.cost}
            // Add a callback to trigger handlePaymentSuccess when user clicks "I have paid"
            onPaid={handlePaymentSuccess}
          />
        );
      case AppStep.PRINTING:
        if (!printJob) return <p>Error: No print job data. Please <button onClick={handleStartNewJob} className="text-primary underline">start over</button>.</p>;
        return (
          <div className="p-1 text-center">
            <h2 className="text-2xl font-semibold text-textPrimary mb-4">Print Job Sent</h2>
            <div className="bg-gray-50 p-6 rounded-lg shadow-md mb-6 text-left space-y-3">
              <h3 className="text-lg font-medium text-textPrimary border-b pb-2 mb-3">Print Job Summary</h3>
              <div className="flex items-center">
                <FileTextIcon className="w-5 h-5 text-primary mr-2 flex-shrink-0" />
                <p><span className="font-medium text-textSecondary">File:</span> <span className="text-textPrimary truncate" title={printJob.fileName}>{printJob.fileName}</span></p>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <p><span className="font-medium text-textSecondary">Pages/Copy:</span> {printJob.pageCount}</p>
                  <p><span className="font-medium text-textSecondary">Copies:</span> {printJob.copies}</p>
                  <p><span className="font-medium text-textSecondary">Orientation:</span> {printJob.orientation}</p>
                  <p><span className="font-medium text-textSecondary">Color:</span> {printJob.colorMode}</p>
                  <p><span className="font-medium text-textSecondary">Sides:</span> {printJob.duplexMode}</p>
              </div>
               <div className="flex items-center pt-2 border-t mt-3">
                  <p><span className="font-medium text-textSecondary">Total Cost Paid:</span> <span className="font-semibold text-textPrimary mr-0.5">RS.</span>{printJob.cost.toFixed(2)}</p>
              </div>
            </div>
            <p className="text-textSecondary mb-6">
              Your document has been sent to the printer. Please check your printer.
            </p>
            <button
              onClick={handlePrintComplete}
              className="w-full max-w-xs mx-auto flex items-center justify-center bg-secondary hover:bg-secondary-hover text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-opacity-50"
            >
              Done
            </button>
          </div>
        );
      case AppStep.THANK_YOU:
        return (
          <div className="text-center p-8 bg-surface shadow-xl rounded-lg">
            <CheckCircleIcon className="w-16 h-16 text-secondary mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-textPrimary mb-2">Print Job Processed!</h2>
            <p className="text-textSecondary mb-6">Your document should be printing. You can start a new job now.</p>
            <button
              onClick={handleStartNewJob}
              className="w-full flex items-center justify-center bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
            >
              <UploadCloudIcon className="w-5 h-5 mr-2" />
              Start New Print Job
            </button>
          </div>
        );
      default:
        return <p>Unknown step. Please <button onClick={handleStartNewJob} className="text-primary underline">start over</button>.</p>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-100 flex flex-col items-center justify-center p-2 sm:p-4">
      <header className="mb-8 text-center w-full max-w-2xl mx-auto px-2">
        <div className="flex flex-col sm:flex-row items-center justify-center mb-2">
            <PrinterIcon className="w-12 h-12 text-primary" />
            <h1 className="text-3xl sm:text-4xl font-bold text-textPrimary ml-0 sm:ml-3 mt-2 sm:mt-0">Meena Store Print Service</h1>
        </div>
        <p className="text-base sm:text-lg text-textSecondary">Upload, pay, and print your documents with ease.</p>
      </header>
      
      <main className="w-full max-w-lg bg-surface p-2 sm:p-6 sm:rounded-xl shadow-2xl mx-auto">
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-error border border-red-300 rounded-lg flex items-center" role="alert">
            <AlertTriangleIcon className="w-5 h-5 mr-3 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800" aria-label="Dismiss error">&times;</button>
          </div>
        )}
        {renderStep()}
      </main>

      <footer className="mt-12 text-center text-xs sm:text-sm text-gray-500 w-full max-w-2xl mx-auto px-2">
        <p>&copy; {new Date().getFullYear()} Meena Store Print Service. All rights reserved.</p>
        <p>Printing cost: {PRICE_PER_PAGE} Rupee per page.</p>
      </footer>
    </div>
  );
};

export default App;