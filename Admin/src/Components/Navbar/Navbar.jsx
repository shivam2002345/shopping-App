import React from 'react'
import './Navbar.css'
import navlogo from '../../assets/newlogo.png';
import navProfile from '../../assets/nav-profile.svg'
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('auth-token'); // Remove the auth token
    navigate('/login'); // Redirect to the login page
  };

  return (
    <div className='navbar'>
      <img src={navlogo} alt="Logo" className="nav-logo" />
      <img src={navProfile} className="nav-profile" alt="Profile" />
      <button className="logout-button" onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Navbar
