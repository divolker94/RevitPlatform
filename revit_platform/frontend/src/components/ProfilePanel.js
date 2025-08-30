import React from 'react';
import './ProfilePanel.css';

const ProfilePanel = ({ title, icon, children, className = '' }) => {
    return (
        <div className={`profile-panel ${className}`}>
            <div className="panel-header">
                <div className="panel-icon">
                    <i className={icon}></i>
                </div>
                <h3 className="panel-title">{title}</h3>
            </div>
            <div className="panel-content">
                {children}
            </div>
        </div>
    );
};

export default ProfilePanel;
