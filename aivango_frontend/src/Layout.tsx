import { Outlet } from 'react-router-dom';
import Header from './components/Header';

const Layout = () => (
  <>
    <Header />
    <main style={{ paddingTop: '1.5rem' }}>
      <Outlet />
    </main>
  </>
);

export default Layout;
