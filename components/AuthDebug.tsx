import { useAuth } from '../hooks/useAuth';

const AuthDebug = () => {
  const { user, token, isAuthenticated, isLoading } = useAuth();

  return (
    <div style={{
      position: 'fixed',
      top: 10,
      right: 10,
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      <div>Loading: {isLoading.toString()}</div>
      <div>Auth: {isAuthenticated.toString()}</div>
      <div>Token: {token ? 'YES' : 'NO'}</div>
      <div>User: {user ? user.username : 'NONE'}</div>
    </div>
  );
};

export default AuthDebug;
