import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { profilePath } from '../utils/routes';
import { useI18n } from '../i18n/useI18n';

const ProfileRedirect = () => {
  const { t } = useI18n();
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  useEffect(() => {
    const redirect = async () => {
      if (!userId) {
        navigate('/profile', { replace: true });
        return;
      }

      try {
        const response = await fetch(`/api/chats/user/${encodeURIComponent(userId)}`);
        if (!response.ok) {
          setError(true);
          return;
        }

        const data = await response.json();
        navigate(profilePath(data.user.username), { replace: true });
      } catch {
        setError(true);
      }
    };

    redirect();
  }, [navigate, userId]);

  if (error) {
    return (
      <div className="page ios-page">
        <div className="ios-card ios-empty-state">
          <h1>{t('profileRedirect.notFound')}</h1>
          <p>Пользователь недоступен или ссылка устарела.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page ios-page">
      <div className="ios-card ios-empty-state">
        <p>{t('profileRedirect.opening')}</p>
      </div>
    </div>
  );
};

export default ProfileRedirect;
