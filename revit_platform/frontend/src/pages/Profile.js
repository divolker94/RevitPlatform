import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaEdit, FaSave, FaTimes, FaCamera, FaTrash } from 'react-icons/fa';
import SpecialistProfile from './profiles/SpecialistProfile';
import LegalEntityProfile from './profiles/LegalEntityProfile';
import IndividualProfile from './profiles/IndividualProfile';
import './Profile.css';

function Profile() {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [profileData, setProfileData] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [avatar, setAvatar] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);

    useEffect(() => {
        loadUserProfile();
    }, []);

    const loadUserProfile = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const userResponse = await fetch('http://localhost:8000/api/accounts/users/me/', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (userResponse.ok) {
                const userData = await userResponse.json();
                console.log('Данные пользователя:', userData);
                console.log('user_type:', userData.user_type);
                console.log('user_role:', userData.user_role);
                setUserData(userData);

                // Загружаем профиль в зависимости от типа пользователя
                if (userData.user_type === 'specialist') {
                    await loadSpecialistProfile(userData);
                } else if (userData.user_type === 'legal' || userData.user_type === 'individual') {
                    // Для юридических и физических лиц используем только данные пользователя
                    console.log('Используем данные пользователя для', userData.user_type);
                    setProfileData(userData);
                }

                // Загружаем аватар
                if (userData.avatar) {
                    setAvatarPreview(`http://localhost:8000${userData.avatar}`);
                }
            } else {
                console.error('Ошибка загрузки профиля:', userResponse.status);
            }
        } catch (error) {
            console.error('Ошибка загрузки профиля:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadSpecialistProfile = async (userData) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8000/api/specialists/me/', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const profileData = await response.json();
                setProfileData({ ...userData, ...profileData });
            } else {
                // Если профиль не найден, используем данные пользователя
                setProfileData(userData);
            }
        } catch (error) {
            console.error('Ошибка загрузки профиля специалиста:', error);
            setProfileData(userData);
        }
    };

    const loadLegalEntityProfile = async (userData) => {
        try {
            const token = localStorage.getItem('token');
            console.log('Загружаем профиль юр. лица для пользователя:', userData.id);
            console.log('Токен:', token ? 'Есть' : 'Нет');
            
            const response = await fetch(`http://localhost:8000/api/clients/${userData.id}/`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            console.log('Ответ от API клиентов:', response.status, response.statusText);
            
            if (response.ok) {
                const profileData = await response.json();
                console.log('Данные профиля юр. лица:', profileData);
                setProfileData({ ...userData, ...profileData });
            } else {
                console.log('Профиль юр. лица не найден, используем данные пользователя');
                setProfileData(userData);
            }
        } catch (error) {
            console.error('Ошибка загрузки профиля юр. лица:', error);
            setProfileData(userData);
        }
    };

    const loadIndividualProfile = async (userData) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8000/api/clients/${userData.id}/`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const profileData = await response.json();
                setProfileData({ ...userData, ...profileData });
            } else {
                setProfileData(userData);
            }
        } catch (error) {
            console.error('Ошибка загрузки профиля физ. лица:', error);
            setProfileData(userData);
        }
    };

    const handleSave = async () => {
        if (!isEditing) return;

        try {
            const token = localStorage.getItem('token');
            let response;

            if (userData.user_type === 'specialist') {
                response = await fetch('http://localhost:8000/api/specialists/me/', {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(profileData),
                });
            } else {
                response = await fetch(`http://localhost:8000/api/clients/${userData.id}/`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(profileData),
                });
            }

            if (response.ok) {
                setIsEditing(false);
                await loadUserProfile(); // Перезагружаем профиль
            } else {
                console.error('Ошибка сохранения:', response.status);
            }
        } catch (error) {
            console.error('Ошибка сохранения:', error);
        }
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatar(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleAvatarUpload = async () => {
        if (!avatar) return;

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('avatar', avatar);

            const response = await fetch(`http://localhost:8000/api/accounts/users/me/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (response.ok) {
                const updatedUser = await response.json();
                setUserData(updatedUser);
                setAvatar(null);
                setAvatarPreview(null);
                await loadUserProfile();
            }
        } catch (error) {
            console.error('Ошибка загрузки аватара:', error);
        }
    };

    const renderProfileContent = () => {
        if (!userData) return null;

        switch (userData.user_type) {
            case 'specialist':
                return (
                    <SpecialistProfile
                        profileData={profileData}
                        setProfileData={setProfileData}
                        isEditing={isEditing}
                        user={userData}
                    />
                );
            case 'legal':
                return (
                    <LegalEntityProfile
                        profileData={profileData}
                        setProfileData={setProfileData}
                        isEditing={isEditing}
                        user={userData}
                    />
                );
            case 'individual':
                return (
                    <IndividualProfile
                        profileData={profileData}
                        setProfileData={setProfileData}
                        isEditing={isEditing}
                        user={userData}
                    />
                );
            default:
                return <div>Неизвестный тип пользователя</div>;
        }
    };

    if (loading) {
        return <div className="loading">Загрузка профиля...</div>;
    }

    if (!userData) {
        return <div className="error">Ошибка загрузки профиля</div>;
    }

    return (
        <div className="profile-container">
            <div className="profile-header">
                <h1>Профиль пользователя</h1>
                <div className="profile-actions">
                    {isEditing ? (
                        <>
                            <button className="btn btn-success" onClick={handleSave}>
                                <FaSave /> Сохранить
                            </button>
                            <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                                <FaTimes /> Отмена
                            </button>
                        </>
                    ) : (
                        <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
                            <FaEdit /> Редактировать профиль
                        </button>
                    )}
                </div>
            </div>

            <div className="profile-content">
                {/* Боковая панель с аватаром и основной информацией */}
                <div className="profile-sidebar">
                    <div className="avatar-section">
                        <div className="avatar-container">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Аватар" className="avatar" />
                            ) : (
                                <div className="avatar-placeholder">
                                    <FaUser />
                                </div>
                            )}
                        </div>
                        
                        {isEditing && (
                            <div className="avatar-actions">
                                <label className="btn btn-secondary btn-sm">
                                    <FaCamera /> Изменить
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                                {avatar && (
                                    <button className="btn btn-success btn-sm" onClick={handleAvatarUpload}>
                                        <FaSave /> Загрузить
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="user-info">
                        <h3>{profileData.first_name} {profileData.last_name}</h3>
                        <p className="user-email">{profileData.email}</p>
                        <div className="profile-type">
                            {userData.user_type === 'specialist' ? 'BIM-специалист' : 
                             userData.user_type === 'legal' ? 'Юридическое лицо' : 'Физическое лицо'}
                        </div>
                        {userData.user_type === 'specialist' && (
                            <div className="specialist-type">
                                {profileData.specialist_type === 'manager' ? 'BIM-менеджер' : 'BIM-исполнитель'}
                            </div>
                        )}
                        
                        {/* Личная информация в боковой панели */}
                        <div className="personal-info-sidebar">
                            <div className="info-item">
                                <label>Телефон:</label>
                                {isEditing ? (
                                    <input
                                        type="tel"
                                        value={profileData.phone || ''}
                                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                                        placeholder="+7 (XXX) XXX-XX-XX"
                                        className="sidebar-input"
                                    />
                                ) : (
                                    <span>{profileData.phone || 'Не указан'}</span>
                                )}
                            </div>
                            {userData.user_type === 'specialist' && (
                                <>
                                    <div className="info-item">
                                        <label>Опыт работы:</label>
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                value={profileData.experience_years || profileData.experience || ''}
                                                onChange={(e) => setProfileData({...profileData, experience_years: e.target.value})}
                                                min="0"
                                                max="50"
                                                className="sidebar-input"
                                            />
                                        ) : (
                                            <span>{profileData.experience_years || profileData.experience || 'Не указан'} лет</span>
                                        )}
                                    </div>
                                    <div className="info-item">
                                        <label>Специализация:</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={profileData.specialization || ''}
                                                onChange={(e) => setProfileData({...profileData, specialization: e.target.value})}
                                                placeholder="Например: Архитектурное проектирование"
                                                className="sidebar-input"
                                            />
                                        ) : (
                                            <span>{profileData.specialization || 'Не указана'}</span>
                                        )}
                                    </div>
                                </>
                            )}
                            {userData.user_type === 'legal' && (
                                <>
                                    <div className="info-item">
                                        <label>Название компании:</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={profileData.company_name || ''}
                                                onChange={(e) => setProfileData({...profileData, company_name: e.target.value})}
                                                placeholder="Название компании"
                                                className="sidebar-input"
                                            />
                                        ) : (
                                            <span>{profileData.company_name || 'Не указано'}</span>
                                        )}
                                    </div>
                                    <div className="info-item">
                                        <label>ИНН:</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={profileData.inn || ''}
                                                onChange={(e) => setProfileData({...profileData, inn: e.target.value})}
                                                placeholder="ИНН"
                                                className="sidebar-input"
                                            />
                                        ) : (
                                            <span>{profileData.inn || 'Не указан'}</span>
                                        )}
                                    </div>
                                </>
                            )}
                            {userData.user_type === 'individual' && (
                                <>
                                    <div className="info-item">
                                        <label>Дата рождения:</label>
                                        {isEditing ? (
                                            <input
                                                type="date"
                                                value={profileData.birth_date || ''}
                                                onChange={(e) => setProfileData({...profileData, birth_date: e.target.value})}
                                                className="sidebar-input"
                                            />
                                        ) : (
                                            <span>{profileData.birth_date || 'Не указана'}</span>
                                        )}
                                    </div>
                                    <div className="info-item">
                                        <label>Адрес:</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={profileData.address || ''}
                                                onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                                                placeholder="Адрес"
                                                className="sidebar-input"
                                            />
                                        ) : (
                                            <span>{profileData.address || 'Не указан'}</span>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Основной контент профиля */}
                <div className="profile-main">
                    {renderProfileContent()}
                </div>
            </div>
        </div>
    );
}

export default Profile;
