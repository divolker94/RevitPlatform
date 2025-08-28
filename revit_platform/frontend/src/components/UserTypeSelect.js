import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './UserTypeSelect.css';

function UserTypeSelect({ onClose }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleUserTypeSelection = async (type) => {
        setLoading(true);
        setError('');

        console.log('Выбираем тип пользователя:', type);

        try {
            // Получаем токен из localStorage
            const token = localStorage.getItem('access_token');
            console.log('Токен найден:', !!token);
            
            if (!token) {
                throw new Error('Токен не найден');
            }

            console.log('Отправляем запрос на установку типа пользователя...');

            // Устанавливаем тип пользователя через API
            const response = await axios.post('http://localhost:8000/api/accounts/users/set_type/', 
                { user_type: type },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('Тип пользователя установлен:', response.data);

            // Показываем сообщение об успехе
            setError(''); // Очищаем ошибки
            setSuccess(`Тип пользователя "${type}" успешно установлен! Перенаправляем...`);
            setLoading(false);

            // Небольшая задержка для показа сообщения об успехе
            setTimeout(() => {
                // Перенаправляем на соответствующий профиль
                if (type === 'legal') {
                    console.log('Перенаправляем на профиль юридического лица...');
                    // Если есть функция onClose, закрываем модальное окно
                    if (onClose) {
                        onClose();
                    }
                    navigate('/legal-entity-profile');
                } else if (type === 'individual') {
                    console.log('Перенаправляем на профиль физического лица...');
                    // Если есть функция onClose, закрываем модальное окно
                    if (onClose) {
                        onClose();
                    }
                    navigate('/individual-profile');
                } else if (type === 'specialist') {
                    console.log('Перенаправляем на профиль специалиста...');
                    // Если есть функция onClose, закрываем модальное окно
                    if (onClose) {
                        onClose();
                    }
                    navigate('/specialist-profile');
                }
            }, 1000); // Задержка 1 секунда

        } catch (err) {
            console.error('Ошибка при выборе типа пользователя:', err);
            console.error('Детали ошибки:', err.response?.data);
            console.error('Статус ошибки:', err.response?.status);
            setError(err.response?.data?.error || 'Ошибка при выборе типа пользователя');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-modal">
            <div className="user-type-modal">
                <button className="close-button" onClick={onClose}>×</button>
                <h2>Выберите тип учетной записи</h2>
                
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}
                
                <div className="user-types-container">
                    <div 
                        className="user-type-option"
                        onClick={() => !loading && handleUserTypeSelection('legal')}
                        style={{ opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                    >
                        <div className="user-type-icon">
                            <i className="fas fa-building"></i>
                        </div>
                        <h3>Юридическое лицо</h3>
                        <p>Для компаний и организаций</p>
                        <ul className="user-type-features">
                            <li>Корпоративный доступ</li>
                            <li>Управление сотрудниками</li>
                            <li>Документооборот</li>
                        </ul>
                    </div>

                    <div 
                        className="user-type-option"
                        onClick={() => !loading && handleUserTypeSelection('individual')}
                        style={{ opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                    >
                        <div className="user-type-icon">
                            <i className="fas fa-user"></i>
                        </div>
                        <h3>Физическое лицо</h3>
                        <p>Для частных заказчиков</p>
                        <ul className="user-type-features">
                            <li>Личный кабинет</li>
                            <li>Индивидуальные проекты</li>
                            <li>Простая регистрация</li>
                        </ul>
                    </div>

                    <div 
                        className="user-type-option"
                        onClick={() => !loading && handleUserTypeSelection('specialist')}
                        style={{ opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                    >
                        <div className="user-type-icon">
                            <i className="fas fa-hard-hat"></i>
                        </div>
                        <h3>BIM-специалист</h3>
                        <p>Для специалистов отрасли</p>
                        <ul className="user-type-features">
                            <li>Профессиональный профиль</li>
                            <li>Портфолио проектов</li>
                            <li>Расширенный доступ</li>
                        </ul>
                    </div>
                </div>
                
                {loading && <div className="loading-message">Загрузка...</div>}
                
                {!loading && !success && (
                    <div className="modal-actions">
                        <button 
                            className="btn-secondary" 
                            onClick={onClose}
                            style={{ marginTop: '20px' }}
                        >
                            Отмена
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default UserTypeSelect;