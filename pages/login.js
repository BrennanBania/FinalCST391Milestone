import { useRouter } from 'next/router';
import LoginPage from '../src/pages/LoginPage';

export default function Login({ onLogin }) {
  const router = useRouter();
  
  return (
    <LoginPage
      onLogin={(token, user) => {
        if (onLogin) {
          onLogin(token, user);
        } else {
          localStorage.setItem('token', token);
          localStorage.setItem('isAdmin', user.role === 'admin' ? 'true' : 'false');
          localStorage.setItem('username', user.username);
          router.push('/');
        }
      }}
    />
  );
}
