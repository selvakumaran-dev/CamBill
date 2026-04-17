import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, AlertCircle } from 'lucide-react';

export default function BarcodeScanner({ onScan, isActive }) {
    const instanceRef = useRef(null);
    const [status, setStatus] = useState('idle');
    const [errMsg, setErrMsg] = useState('');
    const [lastCode, setLastCode] = useState('');
    const scanCache = useRef({ code: '', time: 0 });

    const playBeep = () => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.value = 880; 
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
            osc.stop(ctx.currentTime + 0.15);
        } catch (e) { console.warn('Audio API not supported'); }
    };

    const startScanner = useCallback(async () => {
        if (instanceRef.current) return;
        setStatus('starting'); setErrMsg('');
        try {
            const qr = new Html5Qrcode('qr-reader-region', { verbose: false });
            instanceRef.current = qr;
            await qr.start(
                { facingMode: 'environment' },
                { fps: 15, qrbox: { width: 240, height: 120 }, aspectRatio: 1.7, disableFlip: false },
                (text) => { 
                    const now = Date.now();
                    if (scanCache.current.code === text && (now - scanCache.current.time) < 3000) {
                        return; // Prevent duplicate scan of same item within 3 seconds
                    }
                    scanCache.current = { code: text, time: now };
                    setLastCode(text); 
                    playBeep();
                    onScan(text); 
                },
                () => { }
            );
            setStatus('active');
        } catch (err) {
            instanceRef.current = null;
            const msg = (err?.message || '').toLowerCase();
            if (msg.includes('permission') || msg.includes('denied') || msg.includes('notallowed')) {
                setStatus('denied');
                setErrMsg('Camera permission denied. Allow camera access in browser settings.');
            } else if (msg.includes('notfound') || msg.includes('no camera')) {
                setStatus('error');
                setErrMsg('No camera found. Please connect a camera.');
            } else {
                setStatus('error');
                setErrMsg('Could not start camera. Try refreshing the page.');
            }
        }
    }, [onScan]);

    const stopScanner = useCallback(async () => {
        if (instanceRef.current) {
            try { await instanceRef.current.stop(); instanceRef.current.clear(); } catch (_) { }
            instanceRef.current = null;
        }
        setStatus('idle');
    }, []);

    useEffect(() => {
        if (isActive) startScanner(); else stopScanner();
        return () => { stopScanner(); };
    }, [isActive, startScanner, stopScanner]);

    return (
        <div>
            <div className="scanner-video-wrap">
                <div id="qr-reader-region" className="qr-video-root" />
                {status === 'active' && (
                    <div className="scanner-overlay">
                        <div className="viewfinder">
                            <span className="vf-corner tl" /><span className="vf-corner tr" />
                            <span className="vf-corner bl" /><span className="vf-corner br" />
                            <div className="scan-line" />
                        </div>
                    </div>
                )}
            </div>

            <div className="scanner-status">
                {status === 'active' && <><div className="scanner-dot on" />Scanning — hold barcode steady</>}
                {status === 'starting' && <><div className="scanner-dot on" style={{ background: '#d97706' }} />Starting camera…</>}
                {status === 'idle' && <><div className="scanner-dot off" />Scanner off</>}
                {(status === 'denied' || status === 'error') && (
                    <><AlertCircle size={14} style={{ color: 'var(--red)', flexShrink: 0 }} /><span style={{ color: 'var(--red)', fontSize: '0.78rem' }}>{errMsg}</span></>
                )}
                {status === 'active' && lastCode && (
                    <span style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-3)' }}>
                        Last: {lastCode}
                    </span>
                )}
            </div>
        </div>
    );
}
