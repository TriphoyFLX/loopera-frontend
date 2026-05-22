import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreatePack.module.css';

const CreatePack: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [voiceTag, setVoiceTag] = useState('');
  const [archiveFile, setArchiveFile] = useState<File | null>(null);
  const [previewFile1, setPreviewFile1] = useState<File | null>(null);
  const [previewFile2, setPreviewFile2] = useState<File | null>(null);
  const [voiceTagFile, setVoiceTagFile] = useState<File | null>(null);
  const [textFile, setTextFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!price || parseInt(price) < 0) {
      setError('Valid price is required');
      return;
    }

    if (!archiveFile) {
      setError('Archive file is required');
      return;
    }

    if (!previewFile1) {
      setError('At least one preview file is required');
      return;
    }

    if (!textFile) {
      setError('Text file is required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/auth');
        return;
      }

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('price', price);
      formData.append('voice_tag', voiceTag.trim());
      formData.append('archive', archiveFile);
      formData.append('preview1', previewFile1);
      if (previewFile2) {
        formData.append('preview2', previewFile2);
      }
      if (voiceTagFile) {
        formData.append('voiceTag', voiceTagFile);
      }
      formData.append('textFile', textFile);

      const response = await fetch('/api/shop', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create pack');
      }

      setSuccess('Pack submitted successfully! It will be reviewed by moderators.');
      
      setTimeout(() => {
        navigate('/shop');
      }, 2000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pack');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="create-pack-container">
      <div className="create-pack-header">
        <h1>Create Sound Pack</h1>
        <p>Upload your archive with loops and create a pack to sell on the marketplace</p>
      </div>

      <form onSubmit={handleSubmit} className="create-pack-form">
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            {success}
          </div>
        )}

        <div className="form-section">
          <h2>Basic Information</h2>
          
          <div className="form-group">
            <label htmlFor="title">Pack Title *</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter pack title..."
              maxLength={255}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your pack..."
              rows={4}
              maxLength={1000}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">Price (coins) *</label>
              <input
                type="number"
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                min="0"
                max="10000"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="voiceTag">Voice Tag Text (optional)</label>
              <input
                type="text"
                id="voiceTag"
                value={voiceTag}
                onChange={(e) => setVoiceTag(e.target.value)}
                placeholder="Your producer tag..."
                maxLength={100}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Archive File *</h2>
          <p className="file-description">
            Upload a ZIP file containing all your loops for this pack.
          </p>
          <div className="file-upload-area">
            <input
              type="file"
              id="archiveFile"
              accept=".zip"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setArchiveFile(e.target.files[0]);
                }
              }}
              disabled={loading}
            />
            <label htmlFor="archiveFile" className="file-upload-label">
              <span className="upload-icon">📦</span>
              <span>Upload archive file *</span>
              <span className="upload-hint">ZIP format (Max 500MB)</span>
            </label>
          </div>
          {archiveFile && (
            <div className="uploaded-file-info">
              <span>✅ {archiveFile.name} ({formatFileSize(archiveFile.size)})</span>
            </div>
          )}
          </div>

          <div className="form-section">
          <h2>Preview Files *</h2>
          <p className="file-description">
            Upload 1 or 2 preview loops to showcase your pack.
          </p>
          
          <div className="form-group">
            <label htmlFor="preview1">Preview 1 *</label>
            <div className="file-upload-area">
              <input
                type="file"
                id="preview1"
                accept=".mp3,.wav,.ogg,.m4a,.flac"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setPreviewFile1(e.target.files[0]);
                  }
                }}
                disabled={loading}
              />
              <label htmlFor="preview1" className="file-upload-label">
                <span className="upload-icon">🎵</span>
                <span>Upload first preview *</span>
                <span className="upload-hint">MP3, WAV, OGG, M4A, FLAC (Max 50MB)</span>
              </label>
            </div>
            {previewFile1 && (
              <div className="uploaded-file-info">
                <span>✅ {previewFile1.name} ({formatFileSize(previewFile1.size)})</span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="preview2">Preview 2 (optional)</label>
            <div className="file-upload-area">
              <input
                type="file"
                id="preview2"
                accept=".mp3,.wav,.ogg,.m4a,.flac"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setPreviewFile2(e.target.files[0]);
                  }
                }}
                disabled={loading}
              />
              <label htmlFor="preview2" className="file-upload-label">
                <span className="upload-icon">🎵</span>
                <span>Upload second preview (optional)</span>
                <span className="upload-hint">MP3, WAV, OGG, M4A, FLAC (Max 50MB)</span>
              </label>
            </div>
            {previewFile2 && (
              <div className="uploaded-file-info">
                <span>✅ {previewFile2.name} ({formatFileSize(previewFile2.size)})</span>
              </div>
            )}
          </div>
        </div>

        <div className="form-section">
          <h2>Voice Tag File (optional)</h2>
          <div className="file-upload-area">
            <input
              type="file"
              id="voiceTagFile"
              accept=".mp3,.wav,.ogg,.m4a,.flac"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setVoiceTagFile(e.target.files[0]);
                }
              }}
              disabled={loading}
              />
              <label htmlFor="voiceTagFile" className="file-upload-label">
                <span className="upload-icon">🎤</span>
                <span>Upload voice tag file</span>
                <span className="upload-hint">MP3, WAV, OGG, M4A, FLAC (Max 50MB)</span>
              </label>
            </div>
            {voiceTagFile && (
              <div className="uploaded-file-info">
                <span>✅ {voiceTagFile.name}</span>
              </div>
            )}
          </div>

          <div className="form-section">
            <h2>Text File (required)</h2>
            <p className="file-description">
              Upload a text file with detailed information about your pack, licensing terms, and any additional notes.
            </p>
            <div className="file-upload-area">
              <input
                type="file"
                id="textFile"
              accept=".txt,.rtf,.pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                  setTextFile(e.target.files[0]);
                  }
                }}
              disabled={loading}
                required
              />
              <label htmlFor="textFile" className="file-upload-label">
              <span className="upload-icon">�</span>
                <span>Upload text file *</span>
              <span className="upload-hint">TXT, RTF, PDF format (Max 10MB)</span>
              </label>
            </div>
            {textFile && (
              <div className="uploaded-file-info">
                <span>✅ {textFile.name}</span>
            </div>
          )}
        </div>

        <div className="form-section">
          <h2>Pack Rules</h2>
          <div className="rules-info">
            <div className="rule-item">
              <span className="rule-icon">📦</span>
              <span>Upload archive with loops in ZIP format</span>
            </div>
            <div className="rule-item">
              <span className="rule-icon">🎵</span>
              <span>Add 1-2 preview files for showcasing</span>
            </div>
            <div className="rule-item">
              <span className="rule-icon">⏰</span>
              <span>Account must be at least 3 days old</span>
            </div>
            <div className="rule-item">
              <span className="rule-icon">📦</span>
              <span>Maximum 3 packs per day</span>
            </div>
            <div className="rule-item">
              <span className="rule-icon">👁️</span>
              <span>All packs are reviewed by moderators</span>
            </div>
            <div className="rule-item">
              <span className="rule-icon">💰</span>
              <span>15% commission on all sales</span>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/shop')}
            disabled={loading}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !archiveFile || !previewFile1 || !textFile}
          >
            {loading ? 'Creating...' : 'Submit for Review'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePack;
