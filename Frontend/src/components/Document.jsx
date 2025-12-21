import { useRef, useState } from "react";
import { FaCheckCircle, FaTimesCircle, FaUpload } from "react-icons/fa";
import api from '../services/api.js'; // make sure this path is correct
import "./Document.css";

const DOCUMENT_TYPES = {
  PAN: 'shopPanCard',
  LICENSE: 'pharmacistLicense',
  ID: 'citizenshipId'
};

import { useSearchParams } from 'react-router-dom';

const Document = () => {
  const [searchParams] = useSearchParams();
  const userId = parseInt(searchParams.get('user_id') || '0', 10);
  
  if (!userId) {
    return <div>Error: User ID is missing. Please complete registration first.</div>;
  }
  const [showVerificationPopup, setShowVerificationPopup] = useState(false);
  const [files, setFiles] = useState({
    [DOCUMENT_TYPES.PAN]: null,
    [DOCUMENT_TYPES.LICENSE]: null,
    [DOCUMENT_TYPES.ID]: null
  });
  const [errors, setErrors] = useState({});
  const fileInputs = useRef({});

  const handleFileChange = (type, event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const newErrors = { ...errors };

    if (!validTypes.includes(selectedFile.type)) {
      newErrors[type] = 'Invalid file type. Please upload JPG, PNG, or PDF.';
      setErrors(newErrors);
      return;
    }

    if (selectedFile.size > maxSize) {
      newErrors[type] = 'File size exceeds 5MB limit.';
      setErrors(newErrors);
      return;
    }

    delete newErrors[type];
    setErrors(newErrors);

    setFiles(prev => ({
      ...prev,
      [type]: selectedFile
    }));
  };

  const triggerFileInput = (type) => {
    if (fileInputs.current[type]) {
      fileInputs.current[type].click();
    }
  };

  const removeFile = (type, e) => {
    e.stopPropagation();
    setFiles(prev => ({
      ...prev,
      [type]: null
    }));

    if (fileInputs.current[type]) {
      fileInputs.current[type].value = '';
    }
  };

  const getFileName = (file) => {
    if (!file) return '';
    return file.name.length > 20
      ? `${file.name.substring(0, 15)}...${file.name.split('.').pop()}`
      : file.name;
  };

 // In Document.jsx, update the handleSubmit function:
const handleSubmit = async (e) => {
  e.preventDefault();

  const allFilesUploaded = Object.values(files).every(file => file !== null);
  if (!allFilesUploaded) {
    const newErrors = {};
    Object.keys(files).forEach(key => {
      if (!files[key]) newErrors[key] = 'This file is required.';
    });
    setErrors(prev => ({ ...prev, ...newErrors }));
    return;
  }

  try {
    const formData = new FormData();
    formData.append('user_id', userId.toString());
    
    // Ensure we're using the correct field names that match the backend
    formData.append('pharmacy_license', files[DOCUMENT_TYPES.LICENSE]);
    formData.append('pan_number', files[DOCUMENT_TYPES.PAN]);
    formData.append('citizenship', files[DOCUMENT_TYPES.ID]);

    const response = await api.post('/api/auth/register/step2/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('Upload successful:', response.data);
    setShowVerificationPopup(true);
    
  } catch (error) {
    console.error('Upload failed:', error);
    alert('Failed to upload documents. Please try again.');
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
  }
};
  return (
    <div className="container">
      <header className="header">
        <div className="logo">
          <span className="logo-icon">Pill</span>
          <span className="logo-text">MediStock Pro</span>
        </div>
        <div className="header-right">
          <span className="help-text">Help</span>
          <div className="profile-circle"></div>
        </div>
      </header>

      <div className="progress-container">
        <div className="progress-bar">
          <div className="progress-fill"></div>
        </div>
        <p className="step-text">Step 2 of 3: Document Upload</p>
      </div>

      <main className="main-content">
        <h1 className="title">Upload Your Business Documents</h1>
        <p className="subtitle">
          Please upload the following documents to verify your business and activate your account.
        </p>

        <div className="upload-grid">
          {Object.entries(DOCUMENT_TYPES).map(([key, type]) => (
            <div key={type} className="upload-box" onClick={() => triggerFileInput(type)}>
              <input
                type="file"
                ref={el => fileInputs.current[type] = el}
                onChange={(e) => handleFileChange(type, e)}
                accept=".jpg,.jpeg,.png,.pdf"
                style={{ display: 'none' }}
              />
              <div className={`icon ${type}-icon`}></div>
              <h3 className="upload-title">
                {type === DOCUMENT_TYPES.PAN
                  ? 'Shop PAN Card'
                  : type === DOCUMENT_TYPES.LICENSE
                  ? 'Pharmacist License'
                  : 'Citizenship / ID'}
              </h3>
              <p className="upload-info">JPG, PNG, PDF. Max 5MB.</p>

              {files[type] ? (
                <div className="file-preview">
                  <span className="file-name">
                    <FaCheckCircle className="success-icon" />
                    {getFileName(files[type])}
                  </span>
                  <button
                    className="remove-file"
                    onClick={(e) => removeFile(type, e)}
                  >
                    <FaTimesCircle />
                  </button>
                </div>
              ) : (
                <button className="browse-btn">
                  <FaUpload className="upload-icon" /> Browse Files
                </button>
              )}

              {errors[type] && <p className="error-message">{errors[type]}</p>}
            </div>
          ))}
        </div>

        <div className="submit-container">
          <button className="submit-btn" onClick={handleSubmit}>Submit for Verification</button>
        </div>

        {showVerificationPopup && (
          <div className="verification-popup">
            <div className="verification-content">
              <div className="verification-icon">
                <FaCheckCircle />
              </div>
              <h3>Documents Submitted Successfully!</h3>
              <p>Please wait while we verify your documents. We'll notify you once the verification is complete.</p>
              <button
                className="close-btn"
                onClick={() => setShowVerificationPopup(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Document;
