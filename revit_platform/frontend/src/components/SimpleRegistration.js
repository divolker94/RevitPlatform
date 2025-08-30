import React, { useState } from 'react';
import './SimpleRegistration.css';

function SimpleRegistration({ onSubmit, errors = {}, onClose }) {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        re_password: '',
        first_name: '',
        last_name: '',
        user_type: 'specialist',  // По умолчанию BIM-специалист
        specialist_type: 'executor',  // По умолчанию BIM-исполнитель
        user_role: 'customer'  // По умолчанию заказчик
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
            // Регистрация завершена, пользователь автоматически войдет в систему
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
                <label>Тип пользователя</label>
                <select 
                    name="user_type" 
                    value={formData.user_type} 
                    onChange={handleChange}
                    className="form-control"
                >
                    <option value="specialist">BIM-специалист</option>
                    <option value="individual">Физическое лицо</option>
                    <option value="legal">Юридическое лицо</option>
                </select>

            </div>

            {/* Дополнительный выбор для BIM-специалистов */}
            {formData.user_type === 'specialist' && (
                <div className="form-group">
                    <label>Тип BIM-специалиста</label>
                    <select 
                        name="specialist_type" 
                        value={formData.specialist_type || 'executor'} 
                        onChange={handleChange}
                        className="form-control"
                    >
                        <option value="executor">BIM-исполнитель</option>
                        <option value="manager">BIM-менеджер</option>
                    </select>
                </div>
            )}

            {/* Дополнительный выбор типа специалиста для физических и юридических лиц */}
            {(formData.user_type === 'individual' || formData.user_type === 'legal') && (
                <div className="form-group">
                    <label>Тип специалиста</label>
                    <select 
                        name="user_role" 
                        value={formData.user_role || 'customer'} 
                        onChange={handleChange}
                        className="form-control"
                    >
                        <option value="customer">Заказчик</option>
                        <option value="contractor">Подрядчик</option>
                    </select>
                    <small className="form-help">
                        {formData.user_role === 'customer' 
                            ? 'Заказываете BIM-услуги у специалистов' 
                            : 'Предоставляете BIM-услуги как подрядчик'
                        }
                    </small>
                </div>
            )}

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