// Helper to generate UPI payment URL
function getUpiUrl(upiId: string, name: string, amount: number): string {
  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount.toFixed(2)}&cu=INR`;
}

// Helper to generate QR code as data URL using a simple API (for demo)
function getQrCodeUrl(text: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(text)}&size=200x200`;
}

export const UPIPayment = ({ upiId, name, amount, onPaid }: { upiId: string; name: string; amount: number; onPaid: () => void }) => {
  const upiUrl = getUpiUrl(upiId, name, amount);
  const qrUrl = getQrCodeUrl(upiUrl);

  return (
    <div className="p-4 text-center">
      <h2 className="text-2xl font-semibold text-textPrimary mb-6">Pay with UPI</h2>
      <div className="bg-primary-dark text-white p-6 rounded-lg shadow-lg mb-6">
        <div className="flex flex-col items-center">
          <span className="text-lg">Payable Amount:</span>
          <span className="text-3xl font-bold flex items-center">₹{amount.toFixed(2)}</span>
        </div>
      </div>
      <div className="mb-4">
        <p className="text-textSecondary text-sm">
          UPI ID: <span className="font-semibold text-textPrimary">{upiId}</span>
        </p>
        <p className="text-textSecondary text-sm">Name: <span className="font-semibold text-textPrimary">{name}</span></p>
      </div>
      <div className="flex flex-col items-center mb-4">
        <img src={qrUrl} alt="UPI QR Code" className="mx-auto mb-2 border rounded" width={200} height={200} />
        <span className="text-xs text-gray-500">Scan with any UPI app</span>
      </div>
      <a
        href={upiUrl}
        className="w-full flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-opacity-50 mb-3"
        style={{ textDecoration: 'none' }}
      >
        Pay with UPI App
      </a>
      <button
        onClick={onPaid}
        className="w-full flex items-center justify-center bg-secondary hover:bg-secondary-hover text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-opacity-50"
        aria-label="I have paid"
      >
        I have paid
      </button>
    </div>
  );
};