import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, RefreshCw } from 'lucide-react';

/**
 * Live camera QR scanner.
 * Props:
 *   onScan(decodedText) — called immediately when a QR code is detected
 *   active — boolean to start/stop the scanner
 */
export default function QrCameraScanner({ onScan, active = true }) {
  const containerId = 'qr-camera-region';
  const scannerRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | starting | running | error | stopped
  const [errorMsg, setErrorMsg] = useState('');
  const lastScanned = useRef('');
  const cooldown = useRef(false);

  const startScanner = async () => {
    if (scannerRef.current) return;
    setStatus('starting');
    setErrorMsg('');
    try {
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        setStatus('error');
        setErrorMsg('No camera found on this device.');
        return;
      }

      const scanner = new Html5Qrcode(containerId, { verbose: false });
      scannerRef.current = scanner;

      // Prefer back/environment camera on mobile
      const backCam = cameras.find(
        (c) => c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('rear') || c.label.toLowerCase().includes('environment')
      );
      const cameraId = backCam ? backCam.id : cameras[cameras.length - 1].id;

      await scanner.start(
        cameraId,
        { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1.0 },
        (decodedText) => {
          if (cooldown.current || decodedText === lastScanned.current) return;
          lastScanned.current = decodedText;
          cooldown.current = true;
          onScan(decodedText);
          // 3s cooldown before re-scanning same code
          setTimeout(() => { cooldown.current = false; }, 3000);
        },
        () => {} // suppress per-frame errors
      );
      setStatus('running');
    } catch (err) {
      setStatus('error');
      if (err?.message?.includes('Permission')) {
        setErrorMsg('Camera permission denied. Please allow camera access in your browser settings.');
      } else {
        setErrorMsg(err?.message || 'Could not start camera.');
      }
      scannerRef.current = null;
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (_) {}
      scannerRef.current = null;
    }
    setStatus('stopped');
  };

  useEffect(() => {
    if (active) {
      startScanner();
    } else {
      stopScanner();
    }
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [active]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Camera viewport */}
      <div className="relative w-full max-w-sm mx-auto">
        <div
          id={containerId}
          className="w-full rounded-2xl overflow-hidden bg-slate-900"
          style={{ minHeight: 280 }}
        />

        {/* Overlay states */}
        {status === 'starting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 rounded-2xl gap-3">
            <RefreshCw className="h-8 w-8 text-blue-400 animate-spin" />
            <p className="text-sm text-slate-300">Starting camera…</p>
          </div>
        )}
        {status === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 rounded-2xl gap-3" style={{ minHeight: 280 }}>
            <Camera className="h-10 w-10 text-slate-500" />
            <p className="text-sm text-slate-400">Camera not started</p>
          </div>
        )}
        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 rounded-2xl gap-3 p-6" style={{ minHeight: 280 }}>
            <CameraOff className="h-10 w-10 text-red-400" />
            <p className="text-sm text-red-300 text-center">{errorMsg}</p>
            <button
              onClick={() => { scannerRef.current = null; startScanner(); }}
              className="rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-medium text-white transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Running — scan corners overlay */}
        {status === 'running' && (
          <div className="absolute inset-0 pointer-events-none rounded-2xl">
            {/* Corner brackets */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: 180, height: 180 }}>
              {/* TL */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-400 rounded-tl-sm" />
              {/* TR */}
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-400 rounded-tr-sm" />
              {/* BL */}
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-400 rounded-bl-sm" />
              {/* BR */}
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-400 rounded-br-sm" />
              {/* Scan line animation */}
              <div className="absolute left-0 right-0 h-0.5 bg-blue-400/70 animate-scan-line" />
            </div>
          </div>
        )}
      </div>

      {status === 'running' && (
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          Point your camera at a credential QR code — it will verify automatically
        </p>
      )}
    </div>
  );
}
