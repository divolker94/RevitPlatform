import React from 'react';
import { FaUser, FaBriefcase, FaCog } from 'react-icons/fa';

function SpecialistProfile({ profileData, setProfileData, isEditing, user }) {
    const getSpecialistTypeText = (type) => {
        switch (type) {
            case 'manager': return 'BIM-менеджер';
            case 'executor': return 'BIM-исполнитель';
            default: return 'Специалист';
        }
    };

    return (
        <>
            {/* Основная информация */}
            <div className="section-header">
                <FaUser className="section-icon" />
                <h3>Основная информация</h3>
            </div>
            
            <div className="profile-section">
                <div className="section-content">
                    <div className="form-row">
                        <div className="form-group">
                            <label>Имя</label>
                            <input
                                type="text"
                                value={profileData.first_name || ''}
                                disabled={true}
                                className="disabled-input"
                            />
                        </div>
                        <div className="form-group">
                            <label>Фамилия</label>
                            <input
                                type="text"
                                value={profileData.last_name || ''}
                                disabled={true}
                                className="disabled-input"
                            />
                        </div>
                    </div>
                    
                    <div className="form-group full-width">
                        <label>Email</label>
                        <input
                            type="email"
                            value={profileData.email || ''}
                            disabled={true}
                            className="disabled-input"
                        />
                    </div>
                    
                    
                </div>
            </div>



            {/* Профессиональная информация */}
            <div className="section-header">
                <FaBriefcase className="section-icon" />
                <h3>Профессиональная информация</h3>
            </div>
            
            <div className="profile-section">
                <div className="section-content">
                    <div className="form-row">
                        <div className="form-group">
                            <label>Часовая ставка (₽)</label>
                            <input
                                type="number"
                                value={profileData.hourly_rate || ''}
                                onChange={(e) => setProfileData({...profileData, hourly_rate: e.target.value})}
                                disabled={!isEditing}
                                min="0"
                                step="100"
                            />
                        </div>
                        <div className="form-group">
                            <label>Доступность</label>
                            <input
                                type="text"
                                value={profileData.availability || ''}
                                onChange={(e) => setProfileData({...profileData, availability: e.target.value})}
                                disabled={!isEditing}
                                placeholder="Например: Полная занятость, Частичная занятость"
                            />
                        </div>
                    </div>
                    
                    <div className="form-group full-width">
                        <label>О себе</label>
                        <textarea
                            value={profileData.about || ''}
                            onChange={(e) => setProfileData({...profileData, about: e.target.value})}
                            disabled={!isEditing}
                            rows="4"
                            placeholder="Расскажите о своем опыте, навыках и достижениях"
                        />
                    </div>
                    
                    <div className="form-row">
                        <div className="form-group">
                            <label>Портфолио (ссылка)</label>
                            <input
                                type="url"
                                value={profileData.portfolio || ''}
                                onChange={(e) => setProfileData({...profileData, portfolio: e.target.value})}
                                disabled={!isEditing}
                                placeholder="https://example.com/portfolio"
                            />
                        </div>
                        <div className="form-group">
                        <label>Сертификаты</label>
                        <textarea
                            value={profileData.certificates || ''}
                            onChange={(e) => setProfileData({...profileData, certificates: e.target.value})}
                            disabled={!isEditing}
                            rows="3"
                            placeholder="Укажите ваши сертификаты, дипломы и квалификации"
                        />
                    </div>
                    </div>
                    

                </div>
            </div>
        </>
    );
}

export default SpecialistProfile;
