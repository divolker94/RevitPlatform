import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfileNew.css';
import { FaUser, FaEdit, FaSave, FaTimes, FaCamera, FaBuilding, FaIdCard, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';

function ProfileNew() {
    const [user, setUser] = useState(null);
    const [profileData, setProfileData] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [avatar, setAvatar] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadUserProfile();
    }, []);

    const loadUserProfile = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                navigate('/login');
                return;
            }

            const userResponse = await fetch('http://localhost:8000/api/auth/users/me/', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (userResponse.ok) {
                const userData = await userResponse.json();
                setUser(userData);
                
                if (userData.avatar) {
                    setAvatarPreview(`http://localhost:8000${userData.avatar}`);
                }

                if (userData.user_type === 'specialist') {
                    await loadSpecialistProfile(token);
                } else if (userData.user_type === 'legal') {
                    await loadLegalEntityProfile(token);
                } else if (userData.user_type === 'individual') {
                    await loadIndividualProfile(token);
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            setError('Ошибка при загрузке профиля');
        } finally {
            setLoading(false);
        }
    };

    const loadSpecialistProfile = async (token) => {
        try {
            const response = await fetch('http://localhost:8000/api/specialists/me/', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (response.ok) {
                const data = await response.json();
                setProfileData({
                    ...data,
                    first_name: user.first_name || data.first_name || '',
                    last_name: user.last_name || data.last_name || '',
                    phone: user.phone || data.phone || ''
                });
            }
        } catch (error) {
            console.error('Error loading specialist profile:', error);
        }
    };

    const loadLegalEntityProfile = async (token) => {
        try {
            const response = await fetch('http://localhost:8000/api/clients/legal-entities/', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (response.ok) {
                const data = await response.json();
                if (data.length > 0) {
                    setProfileData({
                        ...data[0],
                        first_name: user.first_name || data[0].first_name || '',
                        last_name: user.last_name || data[0].last_name || '',
                        phone: user.phone || data[0].phone || ''
                    });
                }
            }
        } catch (error) {
            console.error('Error loading legal entity profile:', error);
        }
    };

    const loadIndividualProfile = async (token) => {
        try {
            const response = await fetch('http://localhost:8000/api/clients/individuals/', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (response.ok) {
                const data = await response.json();
                if (data.length > 0) {
                    setProfileData({
                        ...data[0],
                        first_name: user.first_name || data[0].first_name || '',
                        last_name: user.last_name || data[0].last_name || '',
                        phone: user.phone || data[0].phone || ''
                    });
                }
            }
        } catch (error) {
            console.error('Error loading individual profile:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatar(file);
            setAvatarPreview(URL.createObjectURL(file));
            setAvatarLoading(true);
            
            try {
                const formData = new FormData();
                formData.append('avatar', file);
                
                const token = localStorage.getItem('access_token');
                const response = await fetch('http://localhost:8000/api/auth/users/me/', {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                    body: formData,
                });
                
                if (response.ok) {
                    setSuccess('Аватар успешно обновлен');
                }
            } catch (error) {
                setError('Ошибка при загрузке аватара');
            } finally {
                setAvatarLoading(false);
            }
        }
    };

    const handleRemoveAvatar = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('http://localhost:8000/api/auth/users/me/', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ avatar: null }),
            });
            
            if (response.ok) {
                setAvatarPreview(null);
                setAvatar(null);
                setSuccess('Аватар удален');
            }
        } catch (error) {
            setError('Ошибка при удалении аватара');
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        setSuccess('');
        
        try {
            const token = localStorage.getItem('access_token');
            let response;
            
            if (user.user_type === 'specialist') {
                response = await fetch('http://localhost:8000/api/specialists/me/', {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(profileData),
                });
            } else if (user.user_type === 'legal') {
                response = await fetch('http://localhost:8000/api/clients/legal-entities/', {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(profileData),
                });
            } else if (user.user_type === 'individual') {
                response = await fetch('http://localhost:8000/api/clients/individuals/', {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(profileData),
                });
            }
            
            if (response && response.ok) {
                setSuccess('Профиль успешно обновлен');
                setIsEditing(false);
            } else {
                setError('Ошибка при сохранении профиля');
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            setError('Ошибка при сохранении профиля');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        loadUserProfile();
        setError('');
        setSuccess('');
    };

    const renderProfileFields = () => {
        if (!user) return null;

        if (user.user_type === 'specialist') {
            return (
                <>
                    <div className="profile-section">
                        <h4><FaUser /> Личная информация</h4>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Имя</label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={profileData.first_name || ''}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className="form-control"
                                />
                            </div>
                            <div className="form-group">
                                <label>Фамилия</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={profileData.last_name || ''}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className="form-control"
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Телефон</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={profileData.phone || ''}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className="form-control"
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={user.email || ''}
                                    disabled
                                    className="form-control"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="profile-section">
                        <h4><FaBuilding /> Профессиональная информация</h4>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Тип специалиста</label>
                                <select
                                    name="specialist_type"
                                    value={profileData.specialist_type || 'executor'}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className="form-control"
                                >
                                    <option value="executor">Исполнитель</option>
                                    <option value="manager">BIM-менеджер</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Специализация</label>
                                <input
                                    type="text"
                                    name="specialization"
                                    value={profileData.specialization || ''}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className="form-control"
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Опыт работы (лет)</label>
                                <input
                                    type="number"
                                    name="experience"
                                    value={profileData.experience || ''}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className="form-control"
                                />
                            </div>
                            <div className="form-group">
                                <label>Часовая ставка (₽)</label>
                                <input
                                    type="number"
                                    name="hourly_rate"
                                    value={profileData.hourly_rate || ''}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className="form-control"
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>О себе</label>
                            <textarea
                                name="about"
                                value={profileData.about || ''}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className="form-control"
                                rows="4"
                            />
                        </div>
                    </div>
                </>
            );
        } else if (user.user_type === 'legal') {
            return (
                <>
                    <div className="profile-section">
                        <h4><FaBuilding /> Информация об организации</h4>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Тип клиента</label>
                                <select
                                    name="client_type"
                                    value={profileData.client_type || 'customer'}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className="form-control"
                                >
                                    <option value="customer">Заказчик</option>
                                    <option value="contractor">Подрядчик</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Наименование организации</label>
                                <input
                                    type="text"
                                    name="company_name"
                                    value={profileData.company_name || ''}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className="form-control"
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>ИНН</label>
                                <input
                                    type="text"
                                    name="inn"
                                    value={profileData.inn || ''}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className="form-control"
                                />
                            </div>
                            <div className="form-group">
                                <label>КПП</label>
                                <input
                                    type="text"
                                    name="kpp"
                                    value={profileData.kpp || ''}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className="form-control"
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>ОГРН</label>
                            <input
                                type="text"
                                name="ogrn"
                                value={profileData.ogrn || ''}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className="form-control"
                            />
                        </div>
                    </div>

                    <div className="profile-section">
                        <h4><FaUser /> Контактная информация</h4>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Контактное лицо</label>
                                <input
                                    type="text"
                                    name="contact_person"
                                    value={profileData.contact_person || ''}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className="form-control"
                                />
                            </div>
                            <div className="form-group">
                                <label>Телефон</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={profileData.phone || ''}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className="form-control"
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={user.email || ''}
                                disabled
                                className="form-control"
                            />
                        </div>
                    </div>
                </>
            );
        } else if (user.user_type === 'individual') {
            return (
                <>
                    <div className="profile-section">
                        <h4><FaUser /> Личная информация</h4>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Имя</label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={profileData.first_name || ''}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className="form-control"
                                />
                            </div>
                            <div className="form-group">
                                <label>Фамилия</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={profileData.last_name || ''}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className="form-control"
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Телефон</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={profileData.phone || ''}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className="form-control"
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={user.email || ''}
                                    disabled
                                    className="form-control"
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Дата рождения</label>
                                <input
                                    type="date"
                                    name="birth_date"
                                    value={profileData.birth_date || ''}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className="form-control"
                                />
                            </div>
                            <div className="form-group">
                                <label>Адрес</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={profileData.address || ''}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className="form-control"
                                />
                            </div>
                        </div>
                    </div>
                </>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="profile-container">
                <div className="profile-loading">
                    <div className="spinner"></div>
                    <p>Загрузка профиля...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="profile-container">
                <div className="profile-error">
                    <p>Ошибка загрузки профиля</p>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-container">
            <div className="profile-header">
                <h1>Мой профиль</h1>
                <p>Управляйте своими личными данными и настройками</p>
            </div>

            <div className="profile-content">
                <div className="profile-sidebar">
                    <div className="profile-avatar-section">
                        <div className="profile-avatar">
                            {avatarPreview ? (
                                <img 
                                    src={avatarPreview} 
                                    alt="Аватар" 
                                    className="avatar-image"
                                />
                            ) : user.avatar ? (
                                <img 
                                    src={`http://localhost:8000${user.avatar}`} 
                                    alt="Аватар" 
                                    className="avatar-image"
                                />
                            ) : (
                                <div className="avatar-placeholder">
                                    <FaUser />
                                </div>
                            )}
                            {isEditing && (
                                <>
                                    <label className={`avatar-upload ${avatarLoading ? 'loading' : ''}`}>
                                        <FaCamera />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleAvatarChange}
                                            style={{ display: 'none' }}
                                            disabled={avatarLoading}
                                        />
                                    </label>
                                    {(avatarPreview || user.avatar) && (
                                        <button 
                                            className="avatar-remove"
                                            onClick={handleRemoveAvatar}
                                            type="button"
                                            title="Удалить аватар"
                                            disabled={avatarLoading}
                                        >
                                            ×
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                        <div className="profile-info">
                            <h3>{user.first_name || user.email.split('@')[0]} {user.last_name || ''}</h3>
                            <p className="user-type">{getUserTypeLabel(user.user_type)}</p>
                            <p className="user-email">{user.email}</p>
                        </div>
                    </div>

                    <div className="profile-actions">
                        {!isEditing ? (
                            <button 
                                className="btn btn-primary btn-edit"
                                onClick={() => setIsEditing(true)}
                            >
                                <FaEdit /> Редактировать профиль
                            </button>
                        ) : (
                            <div className="edit-actions">
                                <button 
                                    className="btn btn-success btn-save"
                                    onClick={handleSave}
                                    disabled={saving}
                                >
                                    <FaSave /> {saving ? 'Сохранение...' : 'Сохранить'}
                                </button>
                                <button 
                                    className="btn btn-secondary btn-cancel"
                                    onClick={handleCancel}
                                >
                                    <FaTimes /> Отмена
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="profile-main">
                    {error && (
                        <div className="alert alert-danger">
                            {error}
                        </div>
                    )}
                    
                    {success && (
                        <div className="alert alert-success">
                            {success}
                        </div>
                    )}

                    <div className="profile-form">
                        {renderProfileFields()}
                    </div>
                </div>
            </div>
        </div>
    );
}

function getUserTypeLabel(userType) {
    switch (userType) {
        case 'specialist':
            return 'BIM-специалист';
        case 'legal':
            return 'Юридическое лицо';
        case 'individual':
            return 'Физическое лицо';
        default:
            return 'Пользователь';
    }
}

export default ProfileNew;
