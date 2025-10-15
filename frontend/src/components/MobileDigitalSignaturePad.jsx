/**
 * Mobile-Optimized Digital Signature Capture Component
 * Enhanced for touch devices with pressure sensitivity and improved mobile UX
 */

import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
import ReactSignatureCanvas from 'react-signature-canvas';
import { useSignatureOptimization } from '../hooks/useFieldServiceOptimization';
import { MOBILE_SIGNATURE_CONFIG, TouchUtils, MobileViewportUtils } from '../utils/mobile-signature-utils';
import './DigitalSignaturePad.css';
import './mobile-signature.css';

// Mobile signature component with enhanced UX
const MobileDigitalSignaturePad = memo(({
  onSave,
  onClear,
  workOrderId,
  customerName = '',
  isRequired = true,
  maxRetries = 3
}) => {
  const signatureRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [signatureData, setSignatureData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [deviceOrientation, setDeviceOrientation] = useState('portrait');

  // Performance optimization hooks (reserved for future enhancement)
  const _signatureOptimization = useSignatureOptimization({
    throttleMs: MOBILE_SIGNATURE_CONFIG.touchSettings.throttle,
    enablePressureSensitivity: TouchUtils.isTouchDevice()
  });

  // Device orientation detection
  useEffect(() => {
    const handleOrientationChange = () => {
      const orientation = MobileViewportUtils.isLandscape() ? 'landscape' : 'portrait';
      setDeviceOrientation(orientation);

      // Resize canvas after orientation change
      setTimeout(() => {
        if (signatureRef.current) {
          const optimalSize = MobileViewportUtils.getOptimalCanvasSize();
          const canvas = signatureRef.current.getCanvas();
          canvas.width = optimalSize.width;
          canvas.height = optimalSize.height;
        }
      }, 100);
    };

    // Set initial orientation
    handleOrientationChange();

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  // Initialize mobile-specific settings
  useEffect(() => {
    if (signatureRef.current && TouchUtils.isTouchDevice()) {
      const canvas = signatureRef.current.getCanvas();
      TouchUtils.optimizeCanvas(canvas);

      // Prevent scrolling during signature capture
      const cleanup = TouchUtils.preventScrolling(canvas);

      return cleanup;
    }
  }, []);

  // Enhanced drawing handlers for mobile
  const handleDrawStart = useCallback(() => {
    setIsDrawing(true);
    setIsEmpty(false);
    setErrorMessage('');
  }, []);

  const handleDrawEnd = useCallback(() => {
    setIsDrawing(false);

    if (signatureRef.current) {
      const signatureDataURL = signatureRef.current.toDataURL('image/png');
      setSignatureData(signatureDataURL);

      // Provide haptic feedback on mobile
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }
  }, []);

  // Mobile-optimized clear function
  const handleClear = useCallback(() => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setSignatureData(null);
      setIsEmpty(true);
      setErrorMessage('');

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(25);
      }

      if (onClear) {
        onClear();
      }
    }
  }, [onClear]);

  // Enhanced save with mobile optimizations
  const handleSave = useCallback(async () => {
    if (isEmpty || !signatureData) {
      setErrorMessage('Please provide a signature before saving.');
      return;
    }

    try {
      // Compress signature data for mobile networks
      const canvas = signatureRef.current.getCanvas();
      const compressedData = canvas.toDataURL('image/jpeg', 0.8);

      const signatureInfo = {
        signatureData: compressedData,
        workOrderId,
        customerName,
        timestamp: new Date().toISOString(),
        deviceType: TouchUtils.isTouchDevice() ? 'mobile' : 'desktop',
        orientation: deviceOrientation,
        dimensions: {
          width: canvas.width,
          height: canvas.height
        }
      };

      await onSave(signatureInfo);

      // Success haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 100, 50]);
      }

      setRetryCount(0);

    } catch (error) {
      console.error('Failed to save signature:', error);
      setErrorMessage('Failed to save signature. Please try again.');

      setRetryCount(prev => prev + 1);

      if (retryCount >= maxRetries) {
        setErrorMessage('Maximum retry attempts reached. Please check your connection.');
      }

      // Error haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100, 50, 100]);
      }
    }
  }, [isEmpty, signatureData, workOrderId, customerName, deviceOrientation, onSave, retryCount, maxRetries]);

  // Alternative text signature for accessibility
  const [textSignature, setTextSignature] = useState('');
  const [useTextSignature, setUseTextSignature] = useState(false);

  const handleTextSignatureSave = useCallback(async () => {
    if (!textSignature.trim()) {
      setErrorMessage('Please enter your full name for text signature.');
      return;
    }

    try {
      const textSignatureData = {
        textSignature: textSignature.trim(),
        workOrderId,
        customerName,
        timestamp: new Date().toISOString(),
        signatureType: 'text',
        deviceType: 'text-input'
      };

      await onSave(textSignatureData);

    } catch (error) {
      console.error('Failed to save text signature:', error);
      setErrorMessage('Failed to save text signature. Please try again.');
    }
  }, [textSignature, workOrderId, customerName, onSave]);

  return (
    <div
      ref={containerRef}
      className={`mobile-signature-container ${deviceOrientation} ${TouchUtils.isTouchDevice() ? 'touch-device' : 'mouse-device'}`}
      role="group"
      aria-label="Digital signature capture"
    >
      <div className="signature-header">
        <h3>Digital Signature</h3>
        {customerName && (
          <p className="customer-info">
            Customer: <strong>{customerName}</strong>
          </p>
        )}
        {isRequired && (
          <p className="signature-required" role="alert">
            * Signature required to complete work order
          </p>
        )}
      </div>

      {errorMessage && (
        <div className="error-message mobile-error" role="alert">
          {errorMessage}
          {retryCount > 0 && (
            <span className="retry-info">
              (Attempt {retryCount}/{maxRetries})
            </span>
          )}
        </div>
      )}

      <div className="signature-tabs">
        <button
          className={`tab-button ${!useTextSignature ? 'active' : ''}`}
          onClick={() => setUseTextSignature(false)}
          aria-pressed={!useTextSignature}
        >
          Draw Signature
        </button>
        <button
          className={`tab-button ${useTextSignature ? 'active' : ''}`}
          onClick={() => setUseTextSignature(true)}
          aria-pressed={useTextSignature}
        >
          Type Name
        </button>
      </div>

      {!useTextSignature ? (
        <div className="signature-canvas-container">
          <div className="canvas-instructions mobile-instructions">
            <p>
              {TouchUtils.isTouchDevice()
                ? 'Use your finger to sign in the area below'
                : 'Click and drag to create your signature'
              }
            </p>
            {TouchUtils.isTouchDevice() && (
              <p className="touch-tip">
                💡 Use a stylus for better precision
              </p>
            )}
          </div>

          <div className="signature-canvas-wrapper">
            <ReactSignatureCanvas
              ref={signatureRef}
              canvasProps={{
                ...MobileViewportUtils.getOptimalCanvasSize(),
                className: 'signature-canvas mobile-optimized',
                'aria-label': 'Signature drawing area',
                role: 'img'
              }}
              {...MOBILE_SIGNATURE_CONFIG.mobileOptions}
              {...MOBILE_SIGNATURE_CONFIG.touchSettings}
              onBegin={handleDrawStart}
              onEnd={handleDrawEnd}
            />

            {isDrawing && (
              <div className="drawing-indicator" aria-live="polite">
                Drawing...
              </div>
            )}
          </div>

          <div className="signature-controls mobile-controls">
            <button
              className="clear-button mobile-button"
              onClick={handleClear}
              disabled={isEmpty}
              aria-label="Clear signature"
            >
              🗑️ Clear
            </button>

            <button
              className="save-button mobile-button primary"
              onClick={handleSave}
              disabled={isEmpty}
              aria-label="Save signature"
            >
              ✓ Save Signature
            </button>
          </div>
        </div>
      ) : (
        <div className="text-signature-container">
          <div className="text-instructions">
            <p>Type your full legal name as it appears on official documents</p>
          </div>

          <input
            type="text"
            className="text-signature-input mobile-input"
            value={textSignature}
            onChange={(e) => setTextSignature(e.target.value)}
            placeholder="Enter your full name"
            aria-label="Full name for text signature"
            autoComplete="name"
          />

          <div className="text-signature-preview">
            {textSignature && (
              <div className="signature-preview">
                <em>{textSignature}</em>
              </div>
            )}
          </div>

          <div className="signature-controls mobile-controls">
            <button
              className="clear-button mobile-button"
              onClick={() => setTextSignature('')}
              disabled={!textSignature}
              aria-label="Clear text signature"
            >
              🗑️ Clear
            </button>

            <button
              className="save-button mobile-button primary"
              onClick={handleTextSignatureSave}
              disabled={!textSignature.trim()}
              aria-label="Save text signature"
            >
              ✓ Save Text Signature
            </button>
          </div>
        </div>
      )}

      {/* Mobile-specific tips */}
      {TouchUtils.isTouchDevice() && (
        <div className="mobile-tips">
          <h4>Mobile Signature Tips:</h4>
          <ul>
            <li>Rotate to landscape for more space</li>
            <li>Use a stylus for better accuracy</li>
            <li>Take your time - there's no rush</li>
            <li>Clear and retry if not satisfied</li>
          </ul>
        </div>
      )}

      {/* Signature preview for confirmation */}
      {signatureData && !useTextSignature && (
        <div className="signature-confirmation">
          <h4>Signature Preview:</h4>
          <img
            src={signatureData}
            alt="Signature preview"
            className="signature-preview-image"
          />
          <p className="confirmation-text">
            Please review your signature above before saving.
          </p>
        </div>
      )}
    </div>
  );
});

MobileDigitalSignaturePad.displayName = 'MobileDigitalSignaturePad';

export default MobileDigitalSignaturePad;
