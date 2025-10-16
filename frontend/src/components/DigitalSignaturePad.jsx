import React, { useRef, useEffect, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { post, get } from '../api';
import './DigitalSignaturePad.css';

const DigitalSignaturePad = ({ workOrderId, onSignatureComplete, onCancel }) => {
  const sigCanvas = useRef(null);
  const [signatureData, setSignatureData] = useState(null);
  const [signerName, setSignerName] = useState('');
  const [signerTitle, setSignerTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Clear signature when workOrderId changes
    if (sigCanvas.current) {
      sigCanvas.current.clear();
    }
    setSignatureData(null);
    setMessage('');
  }, [workOrderId]);

  const handleClear = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      setSignatureData(null);
      setMessage('');
    }
  };

  const handleSave = async () => {
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      setMessage('Please provide a signature before saving.');
      return;
    }

    if (!signerName.trim()) {
      setMessage('Please enter the signer name.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const signatureDataURL = sigCanvas.current.toDataURL();

      const signatureData = {
        work_order: workOrderId,
        signer_name: signerName,
        signer_title: signerTitle,
        signature_data: signatureDataURL,
        signed_at: new Date().toISOString(),
        ip_address: await getClientIP()
      };

      const response = await post('/api/digital-signatures/', signatureData);

      if (response.status === 201) {
        setMessage('Signature saved successfully!');
        setSignatureData(response.data);

        if (onSignatureComplete) {
          onSignatureComplete(response.data);
        }
      }
    } catch (_err) {
      console.error('Error saving signature:', _err);
      setMessage('Error saving signature. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  const getClientIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'Unknown';
    }
  };

  const handleDownloadPDF = async () => {
    if (!signatureData) return;

    try {
      const response = await get(`/api/digital-signatures/${signatureData.id}/pdf/`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `signature-${workOrderId}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (_err) {
      console.error('Error downloading PDF:', _err);
      setMessage('Error downloading PDF. Please try again.');
    }
  };

  return (
    <div className="signature-pad-container">
      <div className="signature-header">
        <h3>Digital Signature</h3>
        <p>Please sign below to acknowledge completion of the work order.</p>
      </div>

      {!signatureData ? (
        <>
          <div className="signer-info">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="signer-name">Signer Name *</label>
                <input
                  id="signer-name"
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="signer-title">Title/Position</label>
                <input
                  id="signer-title"
                  type="text"
                  value={signerTitle}
                  onChange={(e) => setSignerTitle(e.target.value)}
                  placeholder="Manager, Owner, etc. (optional)"
                />
              </div>
            </div>
          </div>

          <div className="signature-canvas-container">
            <div className="canvas-label">
              <span>Signature:</span>
              <button
                type="button"
                className="clear-btn"
                onClick={handleClear}
              >
                Clear
              </button>
            </div>
            <div className="canvas-wrapper">
              <SignatureCanvas
                ref={sigCanvas}
                canvasProps={{
                  className: 'signature-canvas',
                  width: 500,
                  height: 200
                }}
                backgroundColor="#ffffff"
                penColor="#000000"
                minWidth={1}
                maxWidth={3}
              />
            </div>
            <div className="canvas-instructions">
              <p>Sign above using your mouse, finger, or stylus</p>
            </div>
          </div>

          {message && (
            <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          <div className="signature-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Signature'}
            </button>
          </div>
        </>
      ) : (
        <div className="signature-complete">
          <div className="success-message">
            <h4>✓ Signature Captured Successfully</h4>
            <p>Thank you, {signatureData.signer_name}!</p>
          </div>

          <div className="signature-preview">
            <img
              src={signatureData.signature_data}
              alt="Digital Signature"
              className="signature-image"
            />
          </div>

          <div className="signature-details">
            <p><strong>Signer:</strong> {signatureData.signer_name}</p>
            {signatureData.signer_title && (
              <p><strong>Title:</strong> {signatureData.signer_title}</p>
            )}
            <p><strong>Date:</strong> {new Date(signatureData.signed_at).toLocaleString()}</p>
            <p><strong>Work Order:</strong> #{workOrderId}</p>
          </div>

          <div className="signature-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleDownloadPDF}
            >
              Download PDF
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onSignatureComplete && onSignatureComplete(signatureData)}
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DigitalSignaturePad;
