import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SimpleRegistration.css';

function SimpleRegistration({ onSubmit, errors = {} }) {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        re_password: '',
        first_name: '',
        last_name: ''
    });

    const [loading, setLoading] = useState(false);
    const [localError, setLocalError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');

        if (formData.password !== formData.re_password) {
            setLocalError('Пароли не совпадают!');
            return;
        }

        setLoading(true);
        try {
            await onSubmit(formData);
            // Redirect to UserTypeSelect after successful registration
            navigate('/select-user-type');
        } catch (err) {
            if (err.response?.data) {
                const errorMessage = Object.values(err.response.data).flat().join(', ');
                setLocalError(errorMessage || 'Ошибка при регистрации, попробуйте снова.');
            } else {
                setLocalError('Ошибка при регистрации, попробуйте снова.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const isDisabled = !formData.email || !formData.password || !formData.re_password || !formData.first_name || !formData.last_name || loading;

    return (
        <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
                <label>Имя</label>
                <input 
                    type="text" 
                    name="first_name" 
                    value={formData.first_name} 
                    onChange={handleChange} 
                    required 
                />
                {errors.first_name && <span className="field-error">{errors.first_name}</span>}
            </div>

            <div className="form-group">
                <label>Фамилия</label>
                <input 
                    type="text" 
                    name="last_name" 
                    value={formData.last_name} 
                    onChange={handleChange} 
                    required 
                />
                {errors.last_name && <span className="field-error">{errors.last_name}</span>}
            </div>

            <div className="form-group">
                <label>Email</label>
                <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    required 
                />
                {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="form-group">
                <label>Пароль</label>
                <input 
                    type="password" 
                    name="password" 
                    value={formData.password} 
                    onChange={handleChange} 
                    required 
                />
                {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            <div className="form-group">
                <label>Подтверждение пароля</label>
                <input 
                    type="password" 
                    name="re_password" 
                    value={formData.re_password} 
                    onChange={handleChange} 
                    required 
                />
                {errors.re_password && <span className="field-error">{errors.re_password}</span>}
            </div>

            {(localError || errors.general) && (
                <p className="error-message">{localError || errors.general}</p>
            )}

            <button type="submit" className="btn-primary" disabled={isDisabled}>
                {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
        </form>
    );
}

export default SimpleRegistration;