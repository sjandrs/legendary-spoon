import React from 'react';
import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div>
      <h1>Welcome to Converge</h1>
      <p>This is the home page of our new React frontend.</p>
      <p><Link to="/dashboard">Go to Business Management Software</Link></p>
    </div>
  );
}

export default HomePage;
