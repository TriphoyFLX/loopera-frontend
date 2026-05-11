import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import './PopularHashtags.css';

interface Hashtag {
  tag: string;
  count: number;
}

const PopularHashtags: React.FC = () => {
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHashtags = async () => {
      try {
        const data = await api.getPopularHashtags(8);
        setHashtags(data.hashtags);
      } catch (error) {
        console.error('Error fetching hashtags:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHashtags();
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
            to={`/loops?tag=${hashtag.tag}`}
            className="hashtag-item"
          >
            <span className="hashtag-rank">#{index + 1}</span>
            <span className="hashtag-name">#{hashtag.tag}</span>
            <span className="hashtag-count">{hashtag.count} лупов</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default PopularHashtags;
