import { useLocation } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';

const Layout = ({ children, excludePaths = [] }) => {
  const location = useLocation();
  const shouldShowNavbar = !excludePaths.includes(location.pathname);

  return (
    <>
      {shouldShowNavbar && <Navbar />}
      {children}
    </>  );
};

export default Layout;