import { AuthProvider } from '@/context/auth-context';
import { HomePageView } from '@/components/home-page-view';

export default function Home() {
  return (
    <AuthProvider>
      <HomePageView />
    </AuthProvider>
  );
}
