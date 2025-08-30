import React from 'react';
import { FaBuilding, FaUser, FaIdCard } from 'react-icons/fa';

function LegalEntityProfile({ profileData, setProfileData, isEditing, user }) {
    // Проверяем, есть ли детальные данные профиля
    const hasDetailedProfile = profileData.company_name || profileData.inn || profileData.kpp;
    
    return (
        <>
            {/* Базовая информация о пользователе */}
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

            {/* Информация об организации */}
            <div className="section-header">
                <FaBuilding className="section-icon" />
                <h3>Информация об организации</h3>
            </div>
            
            <div className="profile-section">
                <div className="section-content">
                    {!hasDetailedProfile ? (
                        <div className="profile-notice">
                            <p>Детальная информация об организации не заполнена.</p>
                            <p>Для заполнения профиля обратитесь к администратору.</p>
                        </div>
                    ) : (
                        <>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Название организации</label>
                                    <input
                                        type="text"
                                        value={profileData.company_name || ''}
                                        onChange={(e) => setProfileData({...profileData, company_name: e.target.value})}
                                        disabled={!isEditing}
                                        placeholder="Полное название организации"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>ИНН</label>
                                    <input
                                        type="text"
                                        value={profileData.inn || ''}
                                        onChange={(e) => setProfileData({...profileData, inn: e.target.value})}
                                        disabled={!isEditing}
                                        placeholder="10 или 12 цифр"
                                    />
                                </div>
                            </div>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label>КПП</label>
                                    <input
                                        type="text"
                                        value={profileData.kpp || ''}
                                        onChange={(e) => setProfileData({...profileData, kpp: e.target.value})}
                                        disabled={!isEditing}
                                        placeholder="9 цифр"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>ОГРН</label>
                                    <input
                                        type="text"
                                        value={profileData.ogrn || ''}
                                        onChange={(e) => setProfileData({...profileData, ogrn: e.target.value})}
                                        disabled={!isEditing}
                                        placeholder="13 или 15 цифр"
                                    />
                                </div>
                            </div>
                            
                            <div className="form-group full-width">
                                <label>Юридический адрес</label>
                                <input
                                    type="text"
                                    value={profileData.legal_address || ''}
                                    onChange={(e) => setProfileData({...profileData, legal_address: e.target.value})}
                                    disabled={!isEditing}
                                    placeholder="Полный юридический адрес"
                                />
                            </div>
                            
                            <div className="form-group full-width">
                                <label>Фактический адрес</label>
                                <input
                                    type="text"
                                    value={profileData.actual_address || ''}
                                    onChange={(e) => setProfileData({...profileData, actual_address: e.target.value})}
                                    disabled={!isEditing}
                                    placeholder="Фактический адрес (если отличается от юридического)"
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Контактная информация */}
            <div className="section-header">
                <FaUser className="section-icon" />
                <h3>Контактная информация</h3>
            </div>
            
            <div className="profile-section">
                <div className="section-content">
                    <div className="form-row">
                        <div className="form-group">
                            <label>Контактное лицо</label>
                            <input
                                type="text"
                                value={profileData.contact_person || ''}
                                onChange={(e) => setProfileData({...profileData, contact_person: e.target.value})}
                                disabled={!isEditing}
                                placeholder="ФИО контактного лица"
                            />
                        </div>
                        <div className="form-group">
                            <label>Телефон</label>
                            <input
                                type="tel"
                                value={profileData.phone || ''}
                                onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                                disabled={!isEditing}
                                placeholder="+7 (XXX) XXX-XX-XX"
                            />
                        </div>
                    </div>
                    
                    <div className="form-group full-width">
                        <label>Email</label>
                        <input
                            type="email"
                            value={profileData.email || ''}
                            disabled
                            className="disabled-input"
                        />
                    </div>
                </div>
            </div>

            {/* Банковские реквизиты */}
            <div className="section-header">
                <FaIdCard className="section-icon" />
                <h3>Банковские реквизиты</h3>
            </div>
            
            <div className="profile-section">
                <div className="section-content">
                    <div className="form-row">
                        <div className="form-group">
                            <label>Название банка</label>
                            <input
                                type="text"
                                value={profileData.bank_name || ''}
                                onChange={(e) => setProfileData({...profileData, bank_name: e.target.value})}
                                disabled={!isEditing}
                                placeholder="Полное название банка"
                            />
                        </div>
                        <div className="form-group">
                            <label>БИК</label>
                            <input
                                type="text"
                                value={profileData.bik || ''}
                                onChange={(e) => setProfileData({...profileData, bik: e.target.value})}
                                disabled={!isEditing}
                                placeholder="9 цифр"
                            />
                        </div>
                    </div>
                    
                    <div className="form-row">
                        <div className="form-group">
                            <label>Номер счета</label>
                            <input
                                type="text"
                                value={profileData.account_number || ''}
                                onChange={(e) => setProfileData({...profileData, account_number: e.target.value})}
                                disabled={!isEditing}
                                placeholder="20 цифр"
                            />
                        </div>
                        <div className="form-group">
                            <label>Корр. счет</label>
                            <input
                                type="text"
                                value={profileData.correspondent_account || ''}
                                onChange={(e) => setProfileData({...profileData, correspondent_account: e.target.value})}
                                disabled={!isEditing}
                                placeholder="20 цифр"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default LegalEntityProfile;
