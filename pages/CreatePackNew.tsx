import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CreatePackNew: React.FC = () => {
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

      const response = await fetch('https://loopera-lpr.vercel.app/api/shop', {
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
        navigate('/profile');
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
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Create Sound Pack</h1>
      
      {error && (
        <div style={{ padding: '15px', backgroundColor: '#fee', color: '#c33', marginBottom: '20px', borderRadius: '5px' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ padding: '15px', backgroundColor: '#efe', color: '#3c3', marginBottom: '20px', borderRadius: '5px' }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Pack Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., 'Midnight Melodies'"
            maxLength={255}
            required
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your pack, inspiration, and what users can expect..."
            rows={4}
            maxLength={1000}
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Price (coins) *
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0"
            min="0"
            max="10000"
            required
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Voice Tag Text
          </label>
          <input
            type="text"
            value={voiceTag}
            onChange={(e) => setVoiceTag(e.target.value)}
            placeholder="Your producer tag..."
            maxLength={100}
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Archive File (ZIP) *
          </label>
          <input
            type="file"
            accept=".zip"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setArchiveFile(e.target.files[0]);
              }
            }}
            disabled={loading}
            required
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
          />
          {archiveFile && <p style={{ marginTop: '5px', fontSize: '14px' }}>Selected: {archiveFile.name} ({formatFileSize(archiveFile.size)})</p>}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Preview 1 (MP3/WAV) *
          </label>
          <input
            type="file"
            accept=".mp3,.wav,.ogg,.m4a,.flac"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setPreviewFile1(e.target.files[0]);
              }
            }}
            disabled={loading}
            required
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
          />
          {previewFile1 && <p style={{ marginTop: '5px', fontSize: '14px' }}>Selected: {previewFile1.name} ({formatFileSize(previewFile1.size)})</p>}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Preview 2 (MP3/WAV) - Optional
          </label>
          <input
            type="file"
            accept=".mp3,.wav,.ogg,.m4a,.flac"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setPreviewFile2(e.target.files[0]);
              }
            }}
            disabled={loading}
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
          />
          {previewFile2 && <p style={{ marginTop: '5px', fontSize: '14px' }}>Selected: {previewFile2.name} ({formatFileSize(previewFile2.size)})</p>}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Voice Tag File (MP3/WAV) - Optional
          </label>
          <input
            type="file"
            accept=".mp3,.wav,.ogg,.m4a,.flac"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setVoiceTagFile(e.target.files[0]);
              }
            }}
            disabled={loading}
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
          />
          {voiceTagFile && <p style={{ marginTop: '5px', fontSize: '14px' }}>Selected: {voiceTagFile.name} ({formatFileSize(voiceTagFile.size)})</p>}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Text File (TXT/PDF) *
          </label>
          <input
            type="file"
            accept=".txt,.rtf,.pdf"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setTextFile(e.target.files[0]);
              }
            }}
            disabled={loading}
            required
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
          />
          {textFile && <p style={{ marginTop: '5px', fontSize: '14px' }}>Selected: {textFile.name} ({formatFileSize(textFile.size)})</p>}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button
            type="button"
            onClick={() => navigate('/shop')}
            disabled={loading}
            style={{
              padding: '12px 24px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading || !archiveFile || !previewFile1 || !textFile}
            style={{
              padding: '12px 24px',
              backgroundColor: loading ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px'
            }}
          >
            {loading ? 'Creating...' : 'Submit for Review'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePackNew;
