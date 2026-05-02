import { useRef, useState, useEffect } from "react";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaUpload,
} from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../../services/api.js";
import "./Document.css";

const DOCUMENT_TYPES = {
  PAN: "shopPanCard",
  LICENSE: "pharmacistLicense",
  ID: "citizenshipId",
};

const Document = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const userId =
    location.state?.user_id ||
    location.state?.userId ||
    Number(localStorage.getItem("registration_user_id"));

  useEffect(() => {
    const incomingUserId =
      location.state?.user_id || location.state?.userId;

    if (incomingUserId) {
      localStorage.setItem(
        "registration_user_id",
        incomingUserId
      );
    }
  }, [location.state]);

  const [files, setFiles] = useState({
    [DOCUMENT_TYPES.PAN]: null,
    [DOCUMENT_TYPES.LICENSE]: null,
    [DOCUMENT_TYPES.ID]: null,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] =
    useState(null);

  const fileInputs = useRef({});

  if (!userId) {
    return (
      <div className="verification-page">
        <div className="verification-container">
          <p>Registration session expired.</p>
          <button onClick={() => navigate("/register")}>
            Go to Register
          </button>
        </div>
      </div>
    );
  }

  const handleFileChange = (type, event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    const validTypes = ["image/jpeg", "image/png"];
    const maxSize = 5 * 1024 * 1024;
    const newErrors = { ...errors };

    if (!validTypes.includes(selectedFile.type)) {
      newErrors[type] =
        "Invalid file type. Upload JPG or PNG.";
      setErrors(newErrors);
      return;
    }

    if (selectedFile.size > maxSize) {
      newErrors[type] = "File size exceeds 5MB.";
      setErrors(newErrors);
      return;
    }

    delete newErrors[type];
    setErrors(newErrors);

    setFiles((prev) => ({
      ...prev,
      [type]: selectedFile,
    }));
  };

  const triggerFileInput = (type) => {
    fileInputs.current[type]?.click();
  };

  const removeFile = (type, e) => {
    e.stopPropagation();
    setFiles((prev) => ({
      ...prev,
      [type]: null,
    }));

    if (fileInputs.current[type]) {
      fileInputs.current[type].value = "";
    }
  };

  const getFileName = (file) => {
    if (!file) return "";
    return file.name.length > 25
      ? `${file.name.substring(0, 18)}...`
      : file.name;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const allUploaded = Object.values(files).every(Boolean);
    if (!allUploaded) {
      const newErrors = {};
      Object.keys(files).forEach((key) => {
        if (!files[key]) newErrors[key] = "Required";
      });
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      setVerificationResult(null);

      const formData = new FormData();
      formData.append("user_id", userId);
      formData.append("pan_number", files[DOCUMENT_TYPES.PAN]);
      formData.append(
        "pharmacy_license",
        files[DOCUMENT_TYPES.LICENSE]
      );
      formData.append(
        "citizenship",
        files[DOCUMENT_TYPES.ID]
      );

      const response = await api.post(
        "/api/auth/register/step2/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setVerificationResult({
        verified: true,
        message: response.data.message,
      });

      localStorage.removeItem("registration_user_id");

      setTimeout(() => {
        navigate("/login");
      }, 2500);

    } catch (error) {
      console.error("Document upload error:", error);

      const errorMessage =
        error.response?.data?.error ||
        "Document upload failed. Please try again.";

      setVerificationResult({
        verified: false,
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verification-page">
      <div className="verification-container">

        <div className="verification-header">
          <h2>MediStock Pro</h2>
          <p>Step 2 of 3 – Business Verification</p>
        </div>

        <div className="progress-wrapper">
          <div className="progress-track">
            <div className="progress-fill"></div>
          </div>
        </div>

        <div className="verification-title">
          <h1>Upload Business Documents</h1>
          <p>
            Upload clear images for identity verification.
          </p>
        </div>

        <div className="upload-grid">
          {Object.entries(DOCUMENT_TYPES).map(
            ([_, type]) => (
              <div
                key={type}
                className={`upload-card ${
                  files[type] ? "uploaded" : ""
                }`}
                onClick={() => triggerFileInput(type)}
              >
                <input
                  type="file"
                  hidden
                  ref={(el) =>
                    (fileInputs.current[type] = el)
                  }
                  onChange={(e) =>
                    handleFileChange(type, e)
                  }
                  accept=".jpg,.jpeg,.png"
                />

                <div className="upload-icon-box">
                  <FaUpload />
                </div>

                <h3>
                  {type === DOCUMENT_TYPES.PAN
                    ? "Shop PAN Card"
                    : type === DOCUMENT_TYPES.LICENSE
                    ? "Pharmacist License"
                    : "Citizenship / ID"}
                </h3>

                {files[type] ? (
                  <div className="file-info">
                    <FaCheckCircle className="success-icon" />
                    <span>
                      {getFileName(files[type])}
                    </span>
                    <FaTimesCircle
                      className="remove-icon"
                      onClick={(e) =>
                        removeFile(type, e)
                      }
                    />
                  </div>
                ) : (
                  <p className="upload-hint">
                    Click to upload
                  </p>
                )}

                {errors[type] && (
                  <p className="error-text">
                    {errors[type]}
                  </p>
                )}
              </div>
            )
          )}
        </div>

        <button
          className="verify-btn"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit for Verification"}
        </button>

        {verificationResult && (
          <div className="overlay">
            <div className="result-popup">
              {verificationResult.verified ? (
                <>
                  <FaCheckCircle className="popup-success" />
                  <h3>Documents Uploaded Successfully</h3>

                  <p>
                    Your documents have been submitted successfully.
                  </p>

                  <div className="admin-wait-box">
                    ⏳ Please wait for Admin Verification.
                  </div>

                  <p className="admin-note">
                    Your account will be activated once the admin
                    reviews and approves your documents.
                  </p>
                </>
              ) : (
                <>
                  <FaTimesCircle className="popup-error" />
                  <h3>Upload Failed</h3>
                  <p>{verificationResult.message}</p>
                </>
              )}

              <button
                className="popup-btn"
                onClick={() => navigate("/login")}
              >
                Go to Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Document;