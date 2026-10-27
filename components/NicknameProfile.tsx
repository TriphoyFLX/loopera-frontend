import { Navigate, useParams } from 'react-router-dom';
import { isReservedRoute } from '../utils/routes';
import UserProfile from '../pages/UserProfile';

const NicknameProfile = () => {
  const { nickname } = useParams<{ nickname: string }>();

  if (!nickname || isReservedRoute(nickname)) {
    return <Navigate to="/" replace />;
  }

  return <UserProfile />;
};

export default NicknameProfile;
