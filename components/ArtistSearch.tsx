import React, { useState, useEffect, useRef } from 'react';
import { searchApi, type LoopArtist } from '../utils/searchApi';
import './ArtistSearch.css';

interface ArtistSearchProps {
  onSelect: (artist: LoopArtist) => void;
  placeholder?: string;
  disabled?: boolean;
}

const ArtistSearch: React.FC<ArtistSearchProps> = ({ 
  onSelect, 
  placeholder = "Введите имя или хештег артиста...",
  disabled = false 
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LoopArtist[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Поиск артистов
  useEffect(() => {
    const searchArtists = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await searchApi.searchArtists(query);
        setSuggestions(response.artists);
        setIsOpen(true);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Error searching artists:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(searchArtists, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  // Закрытие дропдауна при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelect(suggestions[selectedIndex]);
        } else if (query.trim()) {
          // Если ничего не выбрано, но есть текст - создаем нового артиста
          handleSelect({
            id: Date.now(),
            username: query.trim(),
            hashtag: query.trim().toLowerCase().replace(/[^a-z0-9]/g, ''),
            loops_count: 0
          });
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelect = (artist: LoopArtist) => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    onSelect(artist);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      handleSelect({
        id: Date.now(),
        username: query.trim(),
        hashtag: query.trim().toLowerCase().replace(/[^a-z0-9]/g, ''),
        loops_count: 0
      });
    }
  };

  return (
    <div className="artist-search" ref={dropdownRef}>
      <form onSubmit={handleFormSubmit} className="artist-search-form">
        <div className="artist-search-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="artist-search-input"
            disabled={disabled}
            autoComplete="off"
          />
          {isLoading && (
            <div className="artist-search-loading">
              <div className="spinner"></div>
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={!query.trim() || disabled}
          className="artist-search-button"
        >
          Подписаться
        </button>
      </form>

      {isOpen && suggestions.length > 0 && (
        <div className="artist-search-dropdown">
          {suggestions.map((artist, index) => (
            <div
              key={artist.id}
              className={`artist-search-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleSelect(artist)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="artist-search-avatar">
                {artist.username.charAt(0).toUpperCase()}
              </div>
              <div className="artist-search-info">
                <div className="artist-search-name">{artist.username}</div>
                <div className="artist-search-hashtag">#{artist.hashtag}</div>
              </div>
              <div className="artist-search-meta">
                {artist.loops_count || 0} луп{(artist.loops_count || 0) === 1 ? '' : (artist.loops_count || 0) < 4 ? 'а' : 'ов'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ArtistSearch;
