import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';
import { FaUser, FaEdit, FaSave, FaTimes, FaCamera, FaBuilding, FaIdCard } from 'react-icons/fa';

function Profile() {
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

            // Загружаем данные пользователя
            const userResponse = await fetch('http://localhost:8000/api/auth/users/me/', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (userResponse.ok) {
                const userData = await userResponse.json();
                setUser(userData);
                
                // Устанавливаем аватар из данных пользователя
                if (userData.avatar) {
                    setAvatarPreview(`http://localhost:8000${userData.avatar}`);
                } else {
                    setAvatarPreview(null);
                }

                // Загружаем профиль в зависимости от типа пользователя
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
                // Объединяем данные пользователя с данными профиля специалиста
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
                    setProfileData(data[0]);
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
                    setProfileData(data[0]);
                }
            }
        } catch (error) {
            console.error('Error loading individual profile:', error);
        }
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Проверяем размер файла (максимум 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('Размер файла не должен превышать 5MB');
                return;
            }
            
            // Проверяем тип файла
            if (!file.type.startsWith('image/')) {
                setError('Пожалуйста, выберите изображение');
                return;
            }
            
            setAvatar(file);
            setError(''); // Очищаем предыдущие ошибки
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveAvatar = () => {
        setAvatar('remove'); // Специальное значение для удаления
        setAvatarPreview(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('access_token');
            let response;

            // Сначала обновляем аватар пользователя, если он был изменен
            if (avatar) {
                setAvatarLoading(true);
                let avatarResponse;
                
                try {
                    if (avatar === 'remove') {
                        // Удаляем аватар
                        avatarResponse = await fetch('http://localhost:8000/api/auth/users/me/', {
                            method: 'PATCH',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ avatar: null }),
                        });
                    } else {
                        // Загружаем новый аватар
                        const formData = new FormData();
                        formData.append('avatar', avatar);
                        
                        avatarResponse = await fetch('http://localhost:8000/api/auth/users/me/', {
                            method: 'PATCH',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                            },
                            body: formData,
                        });
                    }
                
                if (avatarResponse.ok) {
                    const updatedUser = await avatarResponse.json();
                    if (updatedUser.avatar) {
                        setAvatarPreview(`http://localhost:8000${updatedUser.avatar}`);
                        setUser(prev => ({ ...prev, avatar: updatedUser.avatar }));
                    } else {
                        setAvatarPreview(null);
                        setUser(prev => ({ ...prev, avatar: null }));
                    }
                    setAvatar(null); // Сбрасываем локальный файл
                    setSuccess(avatar === 'remove' ? 'Аватар успешно удален!' : 'Аватар успешно обновлен!');
                } else {
                    const avatarError = await avatarResponse.text();
                    console.error('Error updating avatar:', avatarError);
                    setError('Ошибка при обновлении аватара: ' + avatarError);
                    return; // Прерываем выполнение, если аватар не удалось обновить
                }
                } catch (error) {
                    console.error('Error updating avatar:', error);
                    setError('Ошибка при обновлении аватара: ' + error.message);
                    return;
                } finally {
                    setAvatarLoading(false);
                }
            }

            // Затем обновляем профиль
            if (user.user_type === 'specialist') {
                // Для специалистов добавляем значения по умолчанию для обязательных полей
                const specialistData = {
                    ...profileData,
                    specialist_type: profileData.specialist_type || 'executor',
                    specialization: profileData.specialization || 'Не указано',
                    experience: profileData.experience || 'Не указано',
                    about: profileData.about || 'Не указано',
                    availability: profileData.availability || 'Не указано',
                    portfolio: profileData.portfolio || '', // Оставляем пустым для URL поля
                    certificates: profileData.certificates || 'Не указано'
                };
                
                // Сначала пытаемся обновить существующий профиль
                response = await fetch('http://localhost:8000/api/specialists/me/', {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(specialistData),
                });
                
                // Если профиль не существует, создаем новый
                if (response.status === 404) {
                    response = await fetch('http://localhost:8000/api/specialists/', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(specialistData),
                    });
                }
            } else if (user.user_type === 'legal') {
                // Для юридических лиц добавляем значения по умолчанию для обязательных полей
                const legalData = {
                    ...profileData,
                    client_type: profileData.client_type || 'customer',
                    company_name: profileData.company_name || 'Не указано',
                    inn: profileData.inn || 'Не указано',
                    kpp: profileData.kpp || 'Не указано',
                    ogrn: profileData.ogrn || 'Не указано',
                    contact_person: profileData.contact_person || 'Не указано',
                    phone: profileData.phone || 'Не указано',
                    email: profileData.email || 'Не указано',
                    bik: profileData.bik || 'Не указано',
                    account_number: profileData.account_number || 'Не указано',
                    bank_name: profileData.bank_name || 'Не указано'
                };
                
                response = await fetch(`http://localhost:8000/api/clients/legal-entities/${profileData.id}/`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(legalData),
                });
            } else if (user.user_type === 'individual') {
                // Для физических лиц добавляем значения по умолчанию для обязательных полей
                const individualData = {
                    ...profileData,
                    client_type: profileData.client_type || 'customer',
                    first_name: profileData.first_name || 'Не указано',
                    last_name: profileData.last_name || 'Не указано',
                    middle_name: profileData.middle_name || 'Не указано',
                    phone: profileData.phone || 'Не указано',
                    birth_date: profileData.birth_date || null,
                    address: profileData.address || 'Не указано'
                };
                
                response = await fetch(`http://localhost:8000/api/clients/individuals/${profileData.id}/`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(individualData),
                });
            }

            if (response.ok) {
                setSuccess('Профиль успешно обновлен!');
                setIsEditing(false);
            } else {
                const errorData = await response.json();
                setError('Ошибка при обновлении профиля: ' + JSON.stringify(errorData));
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
        loadUserProfile(); // Перезагружаем исходные данные
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
                    <p>Пользователь не найден</p>
                </div>
            </div>
        );
    }

    const renderProfileFields = () => {
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

                    <div className="profile-section">
                        <h4><FaBuilding /> Профессиональная информация</h4>
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
                        <div className="form-group">
                            <label>Доступность</label>
                            <input
                                type="text"
                                name="availability"
                                value={profileData.availability || ''}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className="form-control"
                                placeholder="Например: Полная занятость, Частичная занятость"
                            />
                        </div>
                        <div className="form-group">
                            <label>Портфолио (ссылка)</label>
                            <input
                                type="url"
                                name="portfolio"
                                value={profileData.portfolio || ''}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className="form-control"
                                placeholder="https://example.com/portfolio"
                            />
                        </div>
                        <div className="form-group">
                            <label>Сертификаты</label>
                            <textarea
                                name="certificates"
                                value={profileData.certificates || ''}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className="form-control"
                                rows="3"
                                placeholder="Полученные сертификаты и квалификации"
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
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={profileData.email || ''}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className="form-control"
                            />
                        </div>
                    </div>

                    <div className="profile-section">
                        <h4><FaIdCard /> Банковские реквизиты</h4>
                        <div className="form-group">
                            <label>БИК</label>
                            <input
                                type="text"
                                name="bik"
                                value={profileData.bik || ''}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className="form-control"
                            />
                        </div>
                        <div className="form-group">
                            <label>Номер счета</label>
                            <input
                                type="text"
                                name="account_number"
                                value={profileData.account_number || ''}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className="form-control"
                            />
                        </div>
                        <div className="form-group">
                            <label>Название банка</label>
                            <input
                                type="text"
                                name="bank_name"
                                value={profileData.bank_name || ''}
                                onChange={handleInputChange}
                                disabled={!isEditing}
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
                        <div className="form-group">
                            <label>Отчество</label>
                            <input
                                type="text"
                                name="middle_name"
                                value={profileData.middle_name || ''}
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
                </>
            );
        }
        return null;
    };

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
                            <p className="user-email">{user.email}</p>
                        </div>
                        
                        {/* Блок типа профиля */}
                        <div className="profile-type">
                            <div className="profile-type-label">Тип профиля</div>
                            <div className="profile-type-value">{getUserTypeLabel(user.user_type)}</div>
                        </div>
                        
                        {/* Специализация для BIM-специалистов */}
                        {user.user_type === 'specialist' && profileData.specialization && (
                            <div className="specialist-type">
                                <div className="specialist-type-label">Специализация</div>
                                <div className="specialist-type-value">{profileData.specialization}</div>
                            </div>
                        )}
                        
                        {/* Статистика профиля */}
                        <div className="profile-stats">
                            <div className="stat-item">
                                <div className="stat-value">{profileData.rating || 0}</div>
                                <div className="stat-label">Рейтинг</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-value">{profileData.experience_years || 0}</div>
                                <div className="stat-label">Опыт (лет)</div>
                            </div>
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

export default Profile;
