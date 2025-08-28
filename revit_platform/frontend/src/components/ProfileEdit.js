import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ProfileEdit.css';

function ProfileEdit({ onClose }) {
    const [profile, setProfile] = useState({
        first_name: '',
        last_name: '',
        gender: '',
        birth_year: '',
        interests: [],
        phone: '',
        company: '',
        position: '',
        about: ''
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const interestOptions = [
        'Архитектурное проектирование',
        'Интерьерный дизайн',
        'Ландшафтный дизайн',
        'BIM моделирование',
        'Визуализация',
        'Конструктивные решения',
        'Инженерные системы',
        'Управление проектами'
    ];

    const genderOptions = [
        { value: 'M', label: 'Мужской' },
        { value: 'F', label: 'Женский' },
        { value: 'O', label: 'Другой' }
    ];

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user_data')) || {};
        setProfile(prevProfile => ({
            ...prevProfile,
            first_name: userData.first_name || '',
            last_name: userData.last_name || ''
        }));
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await axios.get('http://localhost:8000/api/auth/users/me/', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setProfile(prevProfile => ({
                ...prevProfile,
                ...response.data
            }));
        } catch (err) {
            setError('Не удалось загрузить данные профиля');
            console.error('Error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const token = localStorage.getItem('access_token');
            await axios.patch('http://localhost:8000/api/auth/users/me/', profile, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setSuccess('Профиль успешно обновлен');
            localStorage.setItem('user_data', JSON.stringify(profile));
        } catch (err) {
            setError('Ошибка при обновлении профиля');
            console.error('Error updating profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleInterestChange = (interest) => {
        setProfile(prev => ({
            ...prev,
            interests: prev.interests.includes(interest)
                ? prev.interests.filter(i => i !== interest)
                : [...prev.interests, interest]
        }));
    };

    if (loading) {
        return <div className="profile-edit-loading">Загрузка...</div>;
    }

    return (
        <div className="profile-edit-container">
            <div className="profile-edit-content">
                <h2>Редактирование профиля</h2>
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <form onSubmit={handleSubmit} className="profile-edit-form">
                    <div className="form-group">
                        <label>Имя</label>
                        <input
                            type="text"
                            name="first_name"
                            value={profile.first_name}
                            onChange={handleChange}
                            placeholder="Введите имя"
                        />
                    </div>

                    <div className="form-group">
                        <label>Фамилия</label>
                        <input
                            type="text"
                            name="last_name"
                            value={profile.last_name}
                            onChange={handleChange}
                            placeholder="Введите фамилию"
                        />
                    </div>

                    <div className="form-group">
                        <label>Пол</label>
                        <select
                            name="gender"
                            value={profile.gender}
                            onChange={handleChange}
                        >
                            <option value="">Выберите пол</option>
                            {genderOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Год рождения</label>
                        <input
                            type="number"
                            name="birth_year"
                            value={profile.birth_year}
                            onChange={handleChange}
                            placeholder="Введите год рождения"
                            min="1900"
                            max={new Date().getFullYear()}
                        />
                    </div>

                    <div className="form-group">
                        <label>Телефон</label>
                        <input
                            type="tel"
                            name="phone"
                            value={profile.phone}
                            onChange={handleChange}
                            placeholder="Введите номер телефона"
                        />
                    </div>

                    <div className="form-group">
                        <label>Компания</label>
                        <input
                            type="text"
                            name="company"
                            value={profile.company}
                            onChange={handleChange}
                            placeholder="Введите название компании"
                        />
                    </div>

                    <div className="form-group">
                        <label>Должность</label>
                        <input
                            type="text"
                            name="position"
                            value={profile.position}
                            onChange={handleChange}
                            placeholder="Введите должность"
                        />
                    </div>

                    <div className="form-group">
                        <label>О себе</label>
                        <textarea
                            name="about"
                            value={profile.about}
                            onChange={handleChange}
                            placeholder="Расскажите о себе"
                            rows="4"
                        />
                    </div>

                    <div className="form-group interests-section">
                        <label>Профессиональные интересы</label>
                        <div className="interests-grid">
                            {interestOptions.map(interest => (
                                <div key={interest} className="interest-checkbox">
                                    <input
                                        type="checkbox"
                                        id={interest}
                                        checked={profile.interests.includes(interest)}
                                        onChange={() => handleInterestChange(interest)}
                                    />
                                    <label htmlFor={interest}>{interest}</label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Сохранение...' : 'Сохранить изменения'}
                        </button>
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Отмена
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ProfileEdit;