import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import './AuthModal.css';
import SimpleRegistration from './SimpleRegistration'; // Ensure this path is correct

function AuthModal({ show, onHide, onLogin }) {
    const [activeTab, setActiveTab] = useState('login');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate(); // Define navigate

    const [loginData, setLoginData] = useState({
        email: '',
        password: ''
    });

    const handleLogin = async (e) => {
        e.preventDefault();
        setErrors({});
        setLoading(true);

        try {
            const response = await axios.post('http://localhost:8000/api/auth/jwt/create/', loginData);
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            
            const userResponse = await axios.get('http://localhost:8000/api/accounts/users/me/', {
                headers: {
                    'Authorization': `Bearer ${response.data.access}`
                }
            });
            localStorage.setItem('username', userResponse.data.username);
            localStorage.setItem('user_data', JSON.stringify(userResponse.data));
            localStorage.setItem('token', response.data.access);
            
            onLogin(userResponse.data.username);
            onHide();
        } catch (err) {
            if (err.response?.status === 401) {
                setErrors({ auth: 'Неверный email или пароль' });
            } else if (err.response?.data) {
                setErrors(err.response.data);
            } else {
                setErrors({ general: 'Произошла ошибка при входе' });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRegistration = async (formData) => {
        setErrors({});
        setLoading(true);

        console.log('Начинаем регистрацию с данными:', formData);

        try {
            const registrationData = {
                email: formData.email,
                password: formData.password,
                re_password: formData.re_password,
                first_name: formData.first_name,
                last_name: formData.last_name,
                user_type: formData.user_type,
                specialist_type: formData.specialist_type,
                user_role: formData.user_role
            };

            console.log('Отправляем данные регистрации:', registrationData);
            console.log('specialist_type:', formData.specialist_type);

            // Регистрируем пользователя через наш API
            const response = await axios.post(
                'http://localhost:8000/api/accounts/register/',
                registrationData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }
            );

            console.log('Регистрация успешна:', response.data);

            // После успешной регистрации автоматически входим
            const loginResponse = await axios.post('http://localhost:8000/api/auth/jwt/create/', 
                {
                    email: formData.email,
                    password: formData.password
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }
            );

            console.log('Вход успешен, сохраняем токены...');

            localStorage.setItem('token', loginResponse.data.access);
            localStorage.setItem('refresh_token', loginResponse.data.refresh);
            
            // Все пользователи сразу входят в систему и попадают на главную страницу
            const userResponse = await axios.get('http://localhost:8000/api/accounts/users/me/', {
                headers: {
                    'Authorization': `Bearer ${loginResponse.data.access}`
                }
            });
            
            localStorage.setItem('username', userResponse.data.username);
            localStorage.setItem('user_data', JSON.stringify(userResponse.data));
            
            onLogin(userResponse.data.username);
            onHide();

        } catch (err) {
            console.error('Ошибка регистрации:', err);
            console.error('Детали ошибки:', err.response?.data);
            console.error('Статус ошибки:', err.response?.status);
            
            // Показываем конкретную ошибку валидации
            if (err.response?.data) {
                if (err.response.data.password) {
                    setErrors({ password: err.response.data.password[0] });
                } else if (err.response.data.email) {
                    setErrors({ email: err.response.data.email[0] });
                } else if (err.response.data.re_password) {
                    setErrors({ re_password: err.response.data.re_password[0] });
                } else if (err.response.data.first_name) {
                    setErrors({ first_name: err.response.data.first_name[0] });
                } else if (err.response.data.last_name) {
                    setErrors({ last_name: err.response.data.last_name[0] });
                } else {
                    setErrors({ general: 'Ошибка при регистрации' });
                }
            } else {
                setErrors({ general: 'Произошла ошибка при регистрации' });
            }
            return;
        } finally {
            setLoading(false);
        }
    };

    const renderLoginForm = () => (
        <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
                <label>Email</label>
                <input
                    type="text"
                    value={loginData.email}
                    onChange={(e) => setLoginData(prev => ({
                        ...prev,
                        email: e.target.value
                    }))}
                    required
                />
            </div>
            
            <div className="form-group">
                <label>Пароль</label>
                <input
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData(prev => ({
                        ...prev,
                        password: e.target.value
                    }))}
                    required
                />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Вход...' : 'Войти'}
            </button>
        </form>
    );

    const renderRegistrationForm = () => (
        <SimpleRegistration 
            onSubmit={handleRegistration} 
            errors={errors} 
            onClose={onHide}
        />
    );

    if (!show) return null;

    return (
        <div className={`auth-modal ${show ? 'show' : ''}`}>
            <div className="auth-modal-content">
                <button className="close-button" onClick={onHide}>×</button>
                
                <div className="auth-tabs">
                    <button
                        className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
                        onClick={() => {
                            setActiveTab('login');
                            setErrors({});
                        }}
                    >
                        Вход
                    </button>
                    <button
                        className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
                        onClick={() => {
                            setActiveTab('register');
                            setErrors({});
                        }}
                    >
                        Регистрация
                    </button>
                </div>

                {errors.general && (
                    <div className="error-message">{errors.general}</div>
                )}

                {activeTab === 'login' ? (
                    renderLoginForm()
                ) : (
                    renderRegistrationForm()
                )}
            </div>
        </div>
    );
}

export default AuthModal;
