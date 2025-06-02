
import React from 'react';
import { Navigate } from 'react-router-dom';

const Home = () => {
  // Redirect to projects page as the main landing page
  return <Navigate to="/projects" replace />;
};

export default Home;
