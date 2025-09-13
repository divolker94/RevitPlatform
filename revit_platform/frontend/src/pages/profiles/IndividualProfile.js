import React from 'react';
import { FaUser, FaIdCard } from 'react-icons/fa';

function IndividualProfile({ profileData, setProfileData, isEditing, user }) {
    // Проверяем, есть ли детальные данные профиля
    const hasDetailedProfile = profileData.phone || profileData.birth_date || profileData.address;
    
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
                    
                    <div className="form-group full-width">
                        <label>Тип специалиста</label>
                        <input
                            type="text"
                            value={profileData.user_role === 'customer' ? 'Заказчик' : 'Подрядчик'}
                            disabled={true}
                            className="disabled-input"
                        />
                    </div>
                </div>
            </div>



            {/* Паспортные данные */}
            <div className="section-header">
                <FaIdCard className="section-icon" />
                <h3>Паспортные данные</h3>
            </div>
            
            <div className="profile-section">
                <div className="section-content">
                    <div className="form-row">
                        <div className="form-group">
                            <label>Серия паспорта</label>
                            <input
                                type="text"
                                value={profileData.passport_series || ''}
                                onChange={(e) => setProfileData({...profileData, passport_series: e.target.value})}
                                disabled={!isEditing}
                                placeholder="XXXX"
                                maxLength="4"
                            />
                        </div>
                        <div className="form-group">
                            <label>Номер паспорта</label>
                            <input
                                type="text"
                                value={profileData.passport_number || ''}
                                onChange={(e) => setProfileData({...profileData, passport_number: e.target.value})}
                                disabled={!isEditing}
                                placeholder="XXXXXX"
                                maxLength="6"
                            />
                        </div>
                    </div>
                    
                    <div className="form-group full-width">
                        <label>Кем выдан</label>
                        <input
                            type="text"
                            value={profileData.passport_issued_by || ''}
                            onChange={(e) => setProfileData({...profileData, passport_issued_by: e.target.value})}
                            disabled={!isEditing}
                            placeholder="Название органа, выдавшего паспорт"
                        />
                    </div>
                    
                    <div className="form-group full-width">
                        <label>Дата выдачи</label>
                        <input
                            type="date"
                            value={profileData.passport_issue_date || ''}
                            onChange={(e) => setProfileData({...profileData, passport_issue_date: e.target.value})}
                            disabled={!isEditing}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}

export default IndividualProfile;
