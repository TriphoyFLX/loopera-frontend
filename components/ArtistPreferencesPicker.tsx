import { useEffect, useMemo, useState } from 'react';
import { artistTypesApi, type ArtistType } from '../utils/artistTypesApi';
import { useI18n } from '../i18n/useI18n';
import './ArtistPreferencesPicker.css';

export const MIN_ARTIST_PREFERENCES = 3;

const normalizeSlug = (value: string) =>
  value.trim().replace(/^#/, '').toLowerCase().replace(/\s+/g, '');

const formatLabel = (slug: string) =>
  slug.charAt(0).toUpperCase() + slug.slice(1);

interface ArtistPreferencesPickerProps {
  initialSelected?: string[];
  minRequired?: number;
  showSkip?: boolean;
  submitLabel?: string;
  onSave: (artists: string[]) => Promise<void>;
  onSkip?: () => Promise<void>;
}

const ArtistPreferencesPicker = ({
  initialSelected = [],
  minRequired = MIN_ARTIST_PREFERENCES,
  showSkip = false,
  submitLabel,
  onSave,
  onSkip,
}: ArtistPreferencesPickerProps) => {
  const { t } = useI18n();
  const [artists, setArtists] = useState<ArtistType[]>([]);
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [customLabels, setCustomLabels] = useState<Record<string, string>>({});
  const [customInput, setCustomInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const resolvedSubmitLabel = submitLabel ?? t('onboarding.save');

  useEffect(() => {
    setSelected(initialSelected);
  }, [initialSelected.join('|')]);

  useEffect(() => {
    const loadArtists = async () => {
      try {
        setLoading(true);
        const data = await artistTypesApi.getPublicArtists();
        setArtists(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('errors.loadArtists'));
      } finally {
        setLoading(false);
      }
    };

    loadArtists();
  }, [t]);

  const slugToName = useMemo(() => {
    const map: Record<string, string> = { ...customLabels };
    artists.forEach((artist) => {
      map[artist.slug] = artist.name;
    });
    return map;
  }, [artists, customLabels]);

  const customSelected = selected.filter(
    (slug) => !artists.some((artist) => artist.slug === slug)
  );

  const toggleArtist = (slug: string) => {
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((item) => item !== slug) : [...prev, slug]
    );
  };

  const addCustomArtist = () => {
    const slug = normalizeSlug(customInput);
    if (!slug) return;

    if (!selected.includes(slug)) {
      setSelected((prev) => [...prev, slug]);
    }

    setCustomLabels((prev) => ({
      ...prev,
      [slug]: customInput.trim().replace(/^#/, ''),
    }));
    setCustomInput('');
  };

  const handleSave = async () => {
    if (selected.length < minRequired) {
      setError(t('onboarding.minRequired', { count: minRequired }));
      return;
    }

    try {
      setSaving(true);
      setError('');
      await onSave(selected);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('onboarding.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    if (!onSkip) return;
    try {
      setSaving(true);
      setError('');
      await onSkip();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('onboarding.skipError'));
    } finally {
      setSaving(false);
    }
  };

  const remaining = Math.max(0, minRequired - selected.length);

  return (
    <div className="artist-preferences">
      <div className="artist-preferences-progress">
        <span className={selected.length >= minRequired ? 'ready' : ''}>
          {t('onboarding.progressMin', { selected: selected.length, min: minRequired })}
        </span>
        {remaining > 0 && (
          <span className="artist-preferences-hint">
            {t('onboarding.remaining', { count: remaining })}
          </span>
        )}
      </div>

      <div className="artist-preferences-custom">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomArtist())}
          placeholder={t('onboarding.customPlaceholder')}
        />
        <button type="button" className="artist-preferences-add" onClick={addCustomArtist}>
          {t('onboarding.add')}
        </button>
      </div>

      {loading ? (
        <div className="artist-preferences-loading">{t('onboarding.loading')}</div>
      ) : (
        <>
          {customSelected.length > 0 && (
            <div className="artist-preferences-section">
              <p className="artist-preferences-label">{t('onboarding.yourArtists')}</p>
              <div className="artist-preferences-grid">
                {customSelected.map((slug) => (
                  <button
                    key={slug}
                    type="button"
                    className="artist-chip selected custom"
                    onClick={() => toggleArtist(slug)}
                  >
                    <span>{slugToName[slug] || formatLabel(slug)}</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12l5 5L20 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="artist-preferences-section">
            <p className="artist-preferences-label">{t('onboarding.popular')}</p>
            <div className="artist-preferences-grid">
              {artists.map((artist) => {
                const isSelected = selected.includes(artist.slug);
                return (
                  <button
                    key={artist.id}
                    type="button"
                    className={`artist-chip ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleArtist(artist.slug)}
                  >
                    <span>{artist.name}</span>
                    {isSelected && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12l5 5L20 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {error && <p className="artist-preferences-error">{error}</p>}

      <div className="artist-preferences-actions">
        {showSkip && onSkip && (
          <button type="button" className="artist-preferences-skip" onClick={handleSkip} disabled={saving}>
            {t('onboarding.later')}
          </button>
        )}
        <button
          type="button"
          className="ios-button-primary"
          onClick={handleSave}
          disabled={saving || selected.length < minRequired}
        >
          {saving
            ? t('onboarding.saving')
            : `${resolvedSubmitLabel}${selected.length ? ` (${selected.length})` : ''}`}
        </button>
      </div>
    </div>
  );
};

export default ArtistPreferencesPicker;
