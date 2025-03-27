const Layout = ({ children, excludePaths = [] }) => {
  const location = useLocation();
  const shouldShowNavbar = !excludePaths.includes(location.pathname);

  return (
    <>
      {shouldShowNavbar && <Navbar />}
      {children}
    </>
  );
};