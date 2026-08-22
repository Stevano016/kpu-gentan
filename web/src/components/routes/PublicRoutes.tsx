import { Navigate, Route, Routes } from 'react-router-dom';
import { LandingPage } from '../landing/LandingPage';
import { LoginScreen } from '../LoginScreen';
import type { AuthController } from '../../hooks/useAuth';

interface PublicRoutesProps {
  auth: AuthController;
  navigate: (to: string) => void;
}

/**
 * Rute sebelum petugas masuk: halaman publik untuk warga, dan layar masuk.
 *
 * Pesan sesi berakhir juga muncul di sini — modal peringatan ikut hilang saat
 * rutenya berpindah ke /login, jadi petugas tidak akan sempat membacanya.
 */
export const PublicRoutes: React.FC<PublicRoutesProps> = ({ auth, navigate }) => (
  <Routes>
    <Route path="/" element={<LandingPage onGoToLogin={() => navigate('/login')} />} />
    <Route path="/login" element={
      <LoginScreen
        handleLogin={auth.handleLogin}
        username={auth.username}
        setUsername={auth.setUsername}
        password={auth.password}
        setPassword={auth.setPassword}
        loginError={auth.loginError}
        showPassword={auth.showPassword}
        setShowPassword={auth.setShowPassword}
        sisaKunci={auth.sisaKunci}
      />
    } />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
