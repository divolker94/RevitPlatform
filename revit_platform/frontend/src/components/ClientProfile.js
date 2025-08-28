import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserAvatar from './UserAvatar'; // Ensure this path is correct
import './ProfileForms.css';
import clientsService from '../services/clients';
import authService from '../services/auth.service';

function ClientProfile({ onSubmit }) {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        // Основная информация
        first_name: '',
        last_name: '',
        middle_name: '',
        phone: '',
        user_type: 'individual',
        
        // Дополнительная информация
        birth_date: '',
        address: '',
        payment_method: '',
        identity_document: null
    });

    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const [userData, setUserData] = useState(null);

    // Загружаем данные пользователя при монтировании компонента
    useEffect(() => {
        const loadUserData = async () => {
            try {
                // Получаем токен через authService
                const token = authService.getToken();
                if (token) {
                    console.log('Токен найден, пользователь авторизован');
                    
                    // Загружаем данные пользователя из localStorage
                    const userData = localStorage.getItem('user_data');
                    if (userData) {
                        const user = JSON.parse(userData);
                        setFormData(prev => ({
                            ...prev,
                            first_name: user.first_name || '',
                            last_name: user.last_name || '',
                            middle_name: user.middle_name || '',
                            phone: user.phone || ''
                        }));
                    }
                }
            } catch (error) {
                console.error('Ошибка при загрузке данных пользователя:', error);
            }
        };

        loadUserData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        setFormData(prev => ({
            ...prev,
            identity_document: e.target.files[0]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Проверяем обязательные поля
        if (!formData.first_name || !formData.last_name || !formData.phone) {
            alert('Пожалуйста, заполните все обязательные поля');
            return;
        }

        // Форматируем данные перед отправкой
        const submitData = {
            middle_name: formData.middle_name || '',
            phone: formData.phone,
            birth_date: formData.birth_date || null,
            address: formData.address || '',
            payment_method: formData.payment_method || ''
        };

        try {
            console.log('Отправляемые данные:', submitData);
            const response = await clientsService.createIndividual(submitData);

            console.log('Статус ответа:', response.status);
            console.log('Ответ сервера:', response.data);

            setUserData(response.data);
            setRegistrationSuccess(true);
            if (onSubmit) {
                onSubmit(response.data);
            }

        } catch (error) {
            console.error('Ошибка при регистрации:', error);
            if (error.response) {
                console.error('Детали ошибки:', error.response.data);
                alert(`Ошибка ${error.response.status}: ${error.response.data.detail || error.response.data.message || 'Неизвестная ошибка'}`);
            } else {
                alert('Ошибка при регистрации: ' + error.message);
            }
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
            <h2>Регистрация клиента</h2>
            
            <div className="form-columns">
                <div className="form-column">
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
                            <label>Отчество</label>
                            <input
                                type="text"
                                name="middle_name"
                                value={formData.middle_name}
                                onChange={handleChange}
                            />
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
                </div>

                <div className="form-column">
                    <div className="form-section">
                        <h3><i className="fas fa-info-circle"></i> Дополнительная информация</h3>
                        <div className="form-group">
                            <label>Дата рождения</label>
                            <input
                                type="date"
                                name="birth_date"
                                value={formData.birth_date}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>Адрес</label>
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                rows="3"
                            />
                        </div>
                        <div className="form-group">
                            <label>Способ оплаты</label>
                            <select
                                name="payment_method"
                                value={formData.payment_method}
                                onChange={handleChange}
                            >
                                <option value="">Выберите способ оплаты</option>
                                <option value="cash">Наличные</option>
                                <option value="card">Банковская карта</option>
                                <option value="transfer">Банковский перевод</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Документ, удостоверяющий личность</label>
                            <input
                                type="file"
                                name="identity_document"
                                onChange={handleFileChange}
                                accept=".pdf,.jpg,.jpeg,.png"
                            />
                            <div className="form-hint">Поддерживаемые форматы: PDF, JPG, PNG</div>
                        </div>
                    </div>
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

export default ClientProfile;