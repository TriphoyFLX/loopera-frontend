import ArtistPreferencesPicker from './ArtistPreferencesPicker';
import { artistTypesApi } from '../utils/artistTypesApi';
import { useI18n } from '../i18n/useI18n';
import './ArtistOnboarding.css';

interface ArtistOnboardingProps {
  open: boolean;
  onComplete: (completed?: boolean) => void;
}

const ArtistOnboarding = ({ open, onComplete }: ArtistOnboardingProps) => {
  const { t } = useI18n();

  if (!open) return null;

  return (
    <div className="artist-onboarding-overlay">
      <div className="artist-onboarding-modal ios-card">
        <span className="artist-onboarding-badge ios-pill">{t('onboarding.subtitle')}</span>
        <h2>{t('onboarding.title')}</h2>
        <p>
          Выбери минимум 3 тайпа — так мы покажем релевантные лупы. Можно добавить своего артиста вручную.
        </p>

        <ArtistPreferencesPicker
          showSkip
          submitLabel={t('onboarding.save')}
          onSave={async (artists) => {
            await artistTypesApi.completeOnboarding(artists);
            onComplete(true);
          }}
          onSkip={async () => {
            await artistTypesApi.skipOnboarding();
            onComplete(false);
          }}
        />
      </div>
    </div>
  );
};

export default ArtistOnboarding;
