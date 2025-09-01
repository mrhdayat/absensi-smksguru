import { Html5QrcodeScanner } from 'html5-qrcode';
import { useEffect } from 'react';

const qrcodeRegionId = "html5qr-code-full-region";

interface Html5QrcodeScannerProps {
  onResult: (result: string) => void;
  verbose?: boolean;
}

const Html5QrcodeScannerComponent: React.FC<Html5QrcodeScannerProps> = ({ onResult, verbose }) => {

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      qrcodeRegionId,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      },
      verbose
    );

    function onScanSuccess(decodedText: string) {
      scanner.clear().then(() => {
        onResult(decodedText);
      }).catch(console.error);
    }

    function onScanError(errorMessage: string) {
      console.warn(errorMessage);
    }

    scanner.render(onScanSuccess, onScanError);

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [onResult, verbose]);

  return <div id={qrcodeRegionId} className="w-full"></div>;
};

export default Html5QrcodeScannerComponent;