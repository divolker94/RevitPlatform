import React from 'react';
import './UserAvatar.css';

function UserAvatar({ user }) {
    const getInitials = (firstName, lastName) => {
        if (!firstName || !lastName) return '';
        return `${lastName.charAt(0).toUpperCase()}${firstName.charAt(0).toUpperCase()}`;
    };

    const getDisplayName = (firstName, lastName) => {
        if (!firstName || !lastName) return '';
        return `${lastName} ${firstName.charAt(0)}.`;
    };

    return (
        <div className="user-avatar-container">
            <div className="user-avatar">
                {getInitials(user.first_name, user.last_name)}
            </div>
            <span className="user-name">{getDisplayName(user.first_name, user.last_name)}</span>
        </div>
    );
}

export default UserAvatar;