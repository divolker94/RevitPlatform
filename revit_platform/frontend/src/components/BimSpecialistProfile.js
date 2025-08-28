import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserAvatar from './UserAvatar';
import './ProfileForms.css';

function BimSpecialistProfile({ onSubmit }) {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        // Основная информация
        first_name: '',
        last_name: '',
        phone: '',
        user_type: 'specialist',
        
        // Профессиональная информация
        specialization: [],
        experience: '',
        
        // Условия работы
        work_type: [],
        availability: '',
        hourly_rate: '',
        
        // Дополнительная информация
        about: '',
        linkedin: '',
        website: ''
    });

    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const [userData, setUserData] = useState(null);

    const specializations = [
        'Архитектурное проектирование',
        'Конструктивные решения',
        'Инженерные системы',
        'BIM-координация',
        'BIM-менеджмент',
        'Визуализация',
        'Энергомоделирование',
        'Управление проектами',
        'Генеральное проектирование',
        'Проектирование фасадов',
        'Проектирование интерьеров',
        'Ландшафтное проектирование',
        'Градостроительное проектирование',
        'Проектирование инженерных сетей',
        'Проектирование вентиляции и кондиционирования',
        'Проектирование электрических систем',
        'Проектирование водоснабжения и канализации',
        'Проектирование систем безопасности',
        'Сметное дело',
        'Техническое обследование зданий'
    ];

    const [customSpecialization, setCustomSpecialization] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSpecializationChange = (specialization) => {
        setFormData(prev => ({
            ...prev,
            specialization: prev.specialization.includes(specialization)
                ? prev.specialization.filter(s => s !== specialization)
                : [...prev.specialization, specialization]
        }));
    };

    const handleAddCustomSpecialization = () => {
        if (customSpecialization && !formData.specialization.includes(customSpecialization)) {
            setFormData(prev => ({
                ...prev,
                specialization: [...prev.specialization, customSpecialization]
            }));
            setCustomSpecialization('');
        }
    };

    const handleMultiSelect = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: prev[name].includes(value)
                ? prev[name].filter(item => item !== value)
                : [...prev[name], value]
        }));
    };



    const handleSubmit = async (e) => {
        e.preventDefault();

        // Получаем токен из localStorage
        const token = localStorage.getItem('access_token');
        if (!token) {
            alert('Токен авторизации не найден. Пожалуйста, войдите в систему.');
            return;
        }

        const submitData = {
            specialization: formData.specialization.join(', ') || '',
            experience: formData.experience || '',
            availability: formData.availability || '',
            hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
            about: formData.about || ''
        };

        try {
            console.log('Отправляемые данные:', submitData);

            // Сначала проверяем, существует ли уже профиль
            console.log('Проверяем существующий профиль...');
            let response = await fetch('http://localhost:8000/api/specialists/me/', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('Статус проверки профиля:', response.status);
            let method = 'POST';
            let url = 'http://localhost:8000/api/specialists/';
            
            if (response.status === 200) {
                // Профиль существует, используем PUT для обновления
                method = 'PUT';
                url = 'http://localhost:8000/api/specialists/me/';
                console.log('Профиль существует, используем PUT для обновления');
            } else {
                console.log('Профиль не существует, создаем новый');
            }

            console.log(`Отправляем ${method} запрос на ${url}`);
            response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(submitData)
            });

            if (!response.ok) {
                let errorMessage = 'Ошибка при сохранении профиля';
                
                try {
                    const responseText = await response.text();
                    console.log('Ответ сервера (текст):', responseText);
                    
                    let data;
                    try {
                        data = JSON.parse(responseText);
                        console.log('Ответ сервера (JSON):', data);
                    } catch (jsonError) {
                        console.error('Ответ сервера не является валидным JSON:', responseText);
                        errorMessage = `Ошибка сервера: ${response.status} ${response.statusText}. Ответ: ${responseText.substring(0, 200)}`;
                        throw new Error(errorMessage);
                    }
                    
                    // Handle specific field errors
                    if (typeof data === 'object') {
                        const errors = [];
                        for (const [field, messages] of Object.entries(data)) {
                            if (Array.isArray(messages)) {
                                errors.push(`${field}: ${messages.join(', ')}`);
                            } else if (typeof messages === 'string') {
                                errors.push(`${field}: ${messages}`);
                            }
                        }
                        if (errors.length > 0) {
                            errorMessage = errors.join('\n');
                        }
                    }
                } catch (parseError) {
                    console.error('Ошибка обработки ответа:', parseError);
                    errorMessage = `Ошибка сервера: ${response.status} ${response.statusText}`;
                }
                
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log('Профиль успешно сохранен:', data);

            setUserData(data);
            setRegistrationSuccess(true);
            if (onSubmit) {
                onSubmit(data);
            }

        } catch (error) {
            console.error('Ошибка при сохранении профиля:', error);
            alert(error.message || 'Произошла ошибка при сохранении профиля');
        }
    };

    if (registrationSuccess && userData) {
        return (
            <div className="registration-success">
                <h2>Регистрация успешно завершена!</h2>
                <div className="user-profile-preview">
                    <UserAvatar user={userData} />
                    <p>Добро пожаловать, {userData.first_name}!</p>
                    <p>Теперь вы можете войти в свой профиль</p>
                </div>
                <button 
                    className="btn-primary"
                    onClick={() => window.location.href = '/profile'}
                >
                    Перейти в профиль
                </button>
            </div>
        );
    }

    return (
        <form className="profile-form" onSubmit={handleSubmit}>
            <h2>Регистрация BIM-специалиста</h2>
            
            <div className="form-section">
                <h3><i className="fas fa-user"></i> Личная информация</h3>
                <div className="form-row">
                    <div className="form-group">
                        <label className="required-field">Имя</label>
                        <input
                            type="text"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="required-field">Фамилия</label>
                        <input
                            type="text"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>
                <div className="form-group">
                    <label className="required-field">Телефон</label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                    />
                </div>
            </div>

            <div className="form-section">
                <h3><i className="fas fa-briefcase"></i> Профессиональная информация</h3>
                <div className="form-group">
                    <label className="required-field">Специализация</label>
                    <div className="specializations-container">
                        <div className="checkbox-grid">
                            {specializations.map(spec => (
                                <label key={spec} className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={formData.specialization.includes(spec)}
                                        onChange={() => handleSpecializationChange(spec)}
                                    />
                                    {spec}
                                </label>
                            ))}
                        </div>
                        <div className="custom-specialization">
                            <div className="form-row">
                                <div className="form-group">
                                    <input
                                        type="text"
                                        value={customSpecialization}
                                        onChange={(e) => setCustomSpecialization(e.target.value)}
                                        placeholder="Добавить свою специализацию"
                                        className="custom-input"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddCustomSpecialization}
                                    className="btn-add-custom"
                                    disabled={!customSpecialization}
                                >
                                    Добавить
                                </button>
                            </div>
                        </div>
                        {formData.specialization.length > 0 && (
                            <div className="selected-specializations">
                                <h4>Выбранные специализации:</h4>
                                <div className="tags-container">
                                    {formData.specialization.map(spec => (
                                        <span key={spec} className="tag">
                                            {spec}
                                            <button
                                                type="button"
                                                onClick={() => handleSpecializationChange(spec)}
                                                className="tag-remove"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="form-group">
                    <label className="required-field">Опыт работы (лет)</label>
                    <input
                        type="number"
                        name="experience"
                        value={formData.experience}
                        onChange={handleChange}
                        required
                        min="0"
                    />
                </div>
            </div>

            <div className="form-section">
                <h3><i className="fas fa-cog"></i> Условия работы</h3>
                <div className="form-group">
                    <label className="required-field">Формат работы</label>
                    <div className="checkbox-grid">
                        {['Удаленно', 'В офисе', 'Гибридный'].map(type => (
                            <label key={type} className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.work_type.includes(type)}
                                    onChange={() => handleMultiSelect('work_type', type)}
                                />
                                {type}
                            </label>
                        ))}
                    </div>
                </div>
                <div className="form-group">
                    <label>Доступность</label>
                    <input
                        type="text"
                        name="availability"
                        value={formData.availability}
                        onChange={handleChange}
                        placeholder="Например: Полная занятость, Частичная занятость"
                    />
                </div>
                <div className="form-group">
                    <label className="required-field">Часовая ставка (₽)</label>
                    <input
                        type="number"
                        name="hourly_rate"
                        value={formData.hourly_rate}
                        onChange={handleChange}
                        required
                        min="0"
                    />
                </div>
            </div>

            <div className="form-section">
                <h3><i className="fas fa-link"></i> Дополнительная информация</h3>
                <div className="form-row">
                    <div className="form-group">
                        <label>LinkedIn профиль</label>
                        <input
                            type="url"
                            name="linkedin"
                            value={formData.linkedin}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>Персональный сайт</label>
                        <input
                            type="url"
                            name="website"
                            value={formData.website}
                            onChange={handleChange}
                        />
                    </div>
                </div>
                <div className="form-group">
                    <label>О себе</label>
                    <textarea
                        name="about"
                        value={formData.about}
                        onChange={handleChange}
                        rows="4"
                    />
                </div>
            </div>

            <div className="form-required-hint">
                <span>*</span> Поля, обязательные для заполнения
            </div>

            <div className="form-actions">
                <button type="button" className="btn-secondary">
                    Отмена
                </button>
                <button type="button" className="btn-secondary" onClick={() => navigate('/profile')}>
                    Перейти к профилю
                </button>
                <button type="submit" className="btn-primary">
                    Зарегистрироваться
                </button>
            </div>
        </form>
    );
}

export default BimSpecialistProfile;