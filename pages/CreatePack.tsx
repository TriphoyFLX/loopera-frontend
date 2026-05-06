import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreatePack.module.css';

interface Loop {
  id: number;
  title: string;
  filename: string;
  duration: number;
  bpm: number;
  key: string;
  genre: string;
  created_at: string;
}

interface UploadedFile {
  id: number;
  filename: string;
  originalName: string;
  size: number;
  title?: string;
  bpm?: number;
  key?: string;
  genre?: string;
}

const CreatePack: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [voiceTag, setVoiceTag] = useState('');
  const [userLoops, setUserLoops] = useState<Loop[]>([]);
  const [selectedLoops, setSelectedLoops] = useState<number[]>([]);
  const [uploadedLoops, setUploadedLoops] = useState<UploadedFile[]>([]);
  const [voiceTagFile, setVoiceTagFile] = useState<File | null>(null);
  const [textFile, setTextFile] = useState<File | null>(null);
  const [textFileContent, setTextFileContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadMode, setUploadMode] = useState<'existing' | 'new'>('existing');
  const [uploadingFiles, setUploadingFiles] = useState(false);

  useEffect(() => {
    fetchUserLoops();
  }, []);

  const fetchUserLoops = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/auth');
        return;
      }

      const response = await fetch('/api/loops/my', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch loops');
      }

      const data = await response.json();
      setUserLoops(data.loops || []);
    } catch (err) {
      console.error('Failed to fetch loops:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch loops');
    }
  };

  const handleLoopToggle = (loopId: number) => {
    setSelectedLoops(prev => {
      if (prev.includes(loopId)) {
        return prev.filter(id => id !== loopId);
      } else if (prev.length < 15) {
        return [...prev, loopId];
      } else {
        setError('Maximum 15 loops allowed per pack');
        return prev;
      }
    });
  };

  const handleLoopFileUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;

    console.log('handleLoopFileUpload called with files:', files.length);
    setUploadingFiles(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }

      const formData = new FormData();
      
      // Добавляем файлы (упрощенно, как в тестовой функции)
      Array.from(files).forEach((file) => {
        formData.append('loops', file);
        console.log('Adding file to FormData:', file.name, file.size, file.type);
      });

      console.log('Sending request to /api/pack-upload/loops');
      const response = await fetch('/api/pack-upload/loops', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload loops');
      }

      setUploadedLoops(prev => [...prev, ...data.loops]);
      setSuccess(`${data.loops.length} loops uploaded successfully`);
    } catch (err) {
      console.error('Error in handleLoopFileUpload:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload loops');
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleVoiceTagUpload = async (file: File) => {
    setUploadingFiles(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const formData = new FormData();
      formData.append('voice_tag_file', file);

      const response = await fetch('/api/pack-upload/voice-tag', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload voice tag');
      }

      setVoiceTagFile(file);
      setSuccess('Voice tag uploaded successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload voice tag');
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleTextFileUpload = async (file: File) => {
    setUploadingFiles(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const formData = new FormData();
      formData.append('text_file', file);

      const response = await fetch('/api/pack-upload/text-file', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload text file');
      }

      const data = await response.json();
      setTextFile(file);
      setTextFileContent(data.content);
      setSuccess('Text file uploaded successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload text file');
    } finally {
      setUploadingFiles(false);
    }
  };

  const removeUploadedLoop = (loopId: number) => {
    setUploadedLoops(prev => prev.filter(loop => loop.id !== loopId));
  };

  const getTotalLoops = () => {
    return selectedLoops.length + uploadedLoops.length;
  };

  
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

    const totalLoops = getTotalLoops();
    if (totalLoops === 0) {
      setError('At least one loop must be selected or uploaded');
      return;
    }

    if (totalLoops > 15) {
      setError('Maximum 15 loops allowed per pack');
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

      const response = await fetch('/api/pack-upload/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          price: parseInt(price),
          voice_tag: voiceTag.trim(),
          voice_tag_file: voiceTagFile?.name || null,
          text_file: textFile?.name || null,
          loopIds: selectedLoops,
          loopFiles: uploadedLoops.map(loop => loop.id)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create pack');
      }

      setSuccess('Pack submitted successfully! It will be reviewed by moderators.');
      
      // Reset form
      setTimeout(() => {
        navigate('/shop');
      }, 2000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pack');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="create-pack-container">
      <div className="create-pack-header">
        <h1>Create Sound Pack</h1>
        <p>Create a pack with your loops to sell on the marketplace</p>
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

          <div className="form-section">
            <h2>Voice Tag File (optional)</h2>
            <div className="file-upload-area">
              <input
                type="file"
                id="voiceTagFile"
                accept=".mp3,.wav,.ogg,.m4a,.flac"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleVoiceTagUpload(e.target.files[0]);
                  }
                }}
                disabled={uploadingFiles}
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
                accept=".txt,.rtf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleTextFileUpload(e.target.files[0]);
                  }
                }}
                disabled={uploadingFiles}
                required
              />
              <label htmlFor="textFile" className="file-upload-label">
                <span className="upload-icon">📄</span>
                <span>Upload text file *</span>
                <span className="upload-hint">TXT or RTF format (Max 10MB)</span>
              </label>
            </div>
            {textFile && (
              <div className="uploaded-file-info">
                <span>✅ {textFile.name}</span>
                {textFileContent && (
                  <div className="text-preview">
                    <h4>Preview:</h4>
                    <p>{textFileContent.substring(0, 200)}{textFileContent.length > 200 ? '...' : ''}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="form-section">
          <h2>
            Loops Management 
            <span className="loop-count">
              ({getTotalLoops()}/15 total)
            </span>
          </h2>

          <div className="loop-mode-toggle">
            <button
              type="button"
              className={`mode-btn ${uploadMode === 'existing' ? 'active' : ''}`}
              onClick={() => setUploadMode('existing')}
            >
              Use Existing Loops
            </button>
            <button
              type="button"
              className={`mode-btn ${uploadMode === 'new' ? 'active' : ''}`}
              onClick={() => setUploadMode('new')}
            >
              Upload New Loops
            </button>
          </div>

          {uploadMode === 'existing' && (
            <>
              {userLoops.length === 0 ? (
                <div className="no-loops">
                  <p>You don't have any loops yet.</p>
                  <button 
                    type="button" 
                    className="upload-loops-btn"
                    onClick={() => navigate('/loop-upload')}
                  >
                    Upload Loops First
                  </button>
                </div>
              ) : (
                <div className="loops-grid">
                  {userLoops.map((loop) => (
                    <div
                      key={loop.id}
                      className={`loop-card ${selectedLoops.includes(loop.id) ? 'selected' : ''}`}
                      onClick={() => handleLoopToggle(loop.id)}
                    >
                      <div className="loop-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedLoops.includes(loop.id)}
                          onChange={() => handleLoopToggle(loop.id)}
                        />
                        <span className="checkmark">✓</span>
                      </div>
                      
                      <div className="loop-info">
                        <h4 className="loop-title">{loop.title}</h4>
                        <div className="loop-meta">
                          <span>🎵 {loop.genre || 'Unknown'}</span>
                          <span>⏱️ {formatDuration(loop.duration)}</span>
                          <span>💓 {loop.bpm} BPM</span>
                          <span>🎹 {loop.key || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {uploadMode === 'new' && (
            <div className="upload-section">
              <div className="file-upload-area">
                <input
                  type="file"
                  id="loopFiles"
                  multiple
                  accept=".mp3,.wav,.ogg,.m4a,.flac"
                  onChange={(e) => {
                    if (e.target.files) {
                      handleLoopFileUpload(e.target.files);
                    }
                  }}
                  disabled={uploadingFiles}
                />
                <label htmlFor="loopFiles" className={`file-upload-label ${uploadingFiles ? 'loading' : ''}`}>
                  <span className="upload-icon">📁</span>
                  <span>{uploadingFiles ? 'Uploading...' : 'Click to upload loops or drag and drop'}</span>
                  <span className="upload-hint">MP3, WAV, OGG, M4A, FLAC (Max 50MB each, up to 15 files)</span>
                </label>
              </div>

              {uploadedLoops.length > 0 && (
                <div className="uploaded-loops">
                  <h4>Uploaded Loops ({uploadedLoops.length})</h4>
                  <div className="uploaded-loops-list">
                    {uploadedLoops.map((loop) => (
                      <div key={loop.id} className="uploaded-loop-item">
                        <span className="loop-name">{loop.originalName}</span>
                        <button
                          type="button"
                          className="remove-btn"
                          onClick={() => removeUploadedLoop(loop.id)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="form-section">
          <h2>Pack Rules</h2>
          <div className="rules-info">
            <div className="rule-item">
              <span className="rule-icon">ℹ️</span>
              <span>Maximum 15 loops per pack</span>
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
            disabled={loading || selectedLoops.length === 0}
          >
            {loading ? 'Creating...' : 'Submit for Review'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePack;
