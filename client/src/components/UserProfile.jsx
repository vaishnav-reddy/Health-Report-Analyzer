import React from 'react';

const UserProfile = ({ user, onLogout }) => {
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onLogout();
  };

  return (
    <div className="user-profile">
      <div className="user-info">
        <span className="user-avatar">👤</span>
        <div className="user-details">
          <span className="user-name">{user.firstName} {user.lastName}</span>
          <span className="user-email">{user.email}</span>
        </div>
      </div>
      <button onClick={handleLogout} className="btn-logout">
        Logout
      </button>
    </div>
  );
};

export default UserProfile;
