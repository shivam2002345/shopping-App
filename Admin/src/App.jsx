import React, { useState, useEffect } from 'react';
import Navbar from './Components/Navbar/Navbar';
import Admin from './Pages/Admin/Admin';
import LoginSignup from './Components/Login';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if the user is logged in by verifying if an auth token exists in localStorage
    const token = localStorage.getItem('auth-token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <div>
      {isLoggedIn ? (
        <>
          <Navbar />
          <Admin />
        </>
      ) : (
        <LoginSignup setIsLoggedIn={setIsLoggedIn} />
      )}
    </div>
  );
};

export default App;