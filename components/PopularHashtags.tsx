import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './PopularHashtags.css';

interface Hashtag {
  tag: string;
  count: number;
}

const PopularHashtags: React.FC = () => {
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Заглушка данных - в будущем можно будет получать с бэкенда
    const mockHashtags: Hashtag[] = [
      { tag: '#trap', count: 234 },
      { tag: '#drill', count: 189 },
      { tag: '#lofi', count: 156 },
      { tag: '#hiphop', count: 134 },
      { tag: '#rnb', count: 98 },
      { tag: '#electronic', count: 87 },
      { tag: '#pop', count: 76 },
      { tag: '#synthwave', count: 65 },
    ];
    
    setHashtags(mockHashtags);
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="hashtags-loading">Загрузка...</div>;
  }

  return (
    <div className="hashtags-container">
      <div className="hashtags-grid">
        {hashtags.map((hashtag, index) => (
          <Link 
            key={hashtag.tag} 
            to={`/loops?tag=${hashtag.tag.replace('#', '')}`}
            className="hashtag-item"
          >
            <span className="hashtag-rank">#{index + 1}</span>
            <span className="hashtag-name">{hashtag.tag}</span>
            <span className="hashtag-count">{hashtag.count} лупов</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default PopularHashtags;
