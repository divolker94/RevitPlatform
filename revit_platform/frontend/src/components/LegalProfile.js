import React, { useState } from 'react';
import UserAvatar from './UserAvatar';
import './ProfileForms.css';

function LegalProfile({ onSubmit }) {
    const [formData, setFormData] = useState({
        // Основная информация
        email: '',
        password: '',
        confirm_password: '',
        company_name: '',
        inn: '',
        kpp: '',
        ogrn: '',
        phone: '',
        user_type: 'legal',
        
        // Контактная информация
        contact_person: '',
        position: '',
        legal_address: '',
        actual_address: '',
        
        // Банковские реквизиты
        bik: '',
        account_number: '',
        bank_name: '',
        signature_type: '',
        
        // Документы
        documents: null
    });

    const [errors, setErrors] = useState({});
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const [userData, setUserData] = useState(null);

    // Валидация полей
    const validateField = (name, value) => {
        switch (name) {
            case 'email':
                return !value ? 'Email обязателен' :
                    !/\S+@\S+\.\S+/.test(value) ? 'Некорректный email' : '';
            case 'password':
                return !value ? 'Пароль обязателен' :
                    value.length < 8 ? 'Пароль должен быть не менее 8 символов' :
                    !/[A-Z]/.test(value) ? 'Пароль должен содержать хотя бы одну заглавную букву' :
                    !/[a-z]/.test(value) ? 'Пароль должен содержать хотя бы одну строчную букву' :
                    !/[0-9]/.test(value) ? 'Пароль должен содержать хотя бы одну цифру' : '';
            case 'inn':
                return !value ? 'ИНН обязателен' :
                    !/^\d{10}$|^\d{12}$/.test(value) ? 'ИНН должен содержать 10 или 12 цифр' : '';
            case 'kpp':
                return !value ? 'КПП обязателен' :
                    !/^\d{9}$/.test(value) ? 'КПП должен содержать 9 цифр' : '';
            case 'ogrn':
                return !value ? 'ОГРН обязателен' :
                    !/^\d{13}$|^\d{15}$/.test(value) ? 'ОГРН должен содержать 13 или 15 цифр' : '';
            case 'phone':
                return !value ? 'Телефон обязателен' :
                    !/^\+?[0-9]{10,15}$/.test(value) ? 'Некорректный формат телефона' : '';
            case 'company_name':
                return !value ? 'Название компании обязательно' : '';
            case 'legal_address':
                return !value ? 'Юридический адрес обязателен' : '';
            default:
                return '';
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Валидация поля при изменении
        const error = validateField(name, value);
        setErrors(prev => ({
            ...prev,
            [name]: error
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB
                setErrors(prev => ({
                    ...prev,
                    documents: 'Размер файла не должен превышать 5MB'
                }));
                return;
            }
            setFormData(prev => ({
                ...prev,
                documents: file
            }));
            setErrors(prev => ({
                ...prev,
                documents: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        Object.keys(formData).forEach(key => {
            const error = validateField(key, formData[key]);
            if (error) {
                newErrors[key] = error;
            }
        });

        if (formData.password !== formData.confirm_password) {
            newErrors.confirm_password = 'Пароли не совпадают';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            alert('Пожалуйста, исправьте ошибки в форме');
            return;
        }

        // Форматируем данные перед отправкой
        const submitData = {
            email: formData.email,
            password: formData.password,
            re_password: formData.confirm_password,
            company_name: formData.company_name,
            inn: formData.inn,
            kpp: formData.kpp,
            ogrn: formData.ogrn,
            phone: formData.phone,
            user_type: 'legal',
            contact_person: formData.contact_person || '',
            position: formData.position || '',
            legal_address: formData.legal_address,
            actual_address: formData.actual_address || '',
            bik: formData.bik || '',
            account_number: formData.account_number || '',
            bank_name: formData.bank_name || '',
            signature_type: formData.signature_type || ''
        };

        try {
            console.log('Отправляемые данные:', submitData);

            const response = await fetch('http://localhost:8000/api/auth/users/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submitData)
            });

            const data = await response.json();
            console.log('Ответ сервера:', data);

            if (!response.ok) {
                const errorMessages = {};
                Object.keys(data).forEach(key => {
                    errorMessages[key] = Array.isArray(data[key]) ? data[key][0] : data[key];
                });
                setErrors(errorMessages);
                throw new Error(data.detail || 'Ошибка при регистрации');
            }

            // Если есть документы, загружаем их
            if (formData.documents) {
                const formDataWithFiles = new FormData();
                formDataWithFiles.append('documents', formData.documents);
                
                await fetch(`http://localhost:8000/api/auth/users/${data.id}/documents/`, {
                    method: 'POST',
                    body: formDataWithFiles
                });
            }

            // Получаем токен
            const tokenResponse = await fetch('http://localhost:8000/api/auth/jwt/create/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password
                })
            });

            const tokenData = await tokenResponse.json();

            if (!tokenResponse.ok) {
                throw new Error(tokenData.detail || 'Ошибка при получении токена');
            }

            localStorage.setItem('access_token', tokenData.access);
            localStorage.setItem('refresh_token', tokenData.refresh);

            const userResponse = await fetch('http://localhost:8000/api/auth/users/me/', {
                headers: {
                    'Authorization': `Bearer ${tokenData.access}`
                }
            });

            const userData = await userResponse.json();
            localStorage.setItem('user', JSON.stringify(userData));
            
            setUserData(userData);
            setRegistrationSuccess(true);
            onSubmit(userData);

        } catch (error) {
            console.error('Ошибка при регистрации:', error);
            alert(error.message || 'Произошла ошибка при регистрации');
        }
    };

    if (registrationSuccess && userData) {
        return (
            <div className="registration-success">
                <h2>Регистрация успешно завершена!</h2>
                <div className="user-profile-preview">
                    <UserAvatar user={userData} />
                    <p>Добро пожаловать, {userData.company_name}!</p>
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
            <h2>Регистрация юридического лица</h2>
            
            <div className="form-columns">
                <div className="form-column">
                    <div className="form-section">
                        <h3><i className="fas fa-user-lock"></i> Данные для входа</h3>
                        <div className="form-group">
                            <label className="required-field">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={errors.email ? 'form-input-error' : ''}
                                required
                            />
                            {errors.email && <div className="form-error">{errors.email}</div>}
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="required-field">Пароль</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={errors.password ? 'form-input-error' : ''}
                                    required
                                />
                                <div className="form-hint">Минимум 8 символов, одна заглавная буква и цифра</div>
                                {errors.password && <div className="form-error">{errors.password}</div>}
                            </div>
                            <div className="form-group">
                                <label className="required-field">Подтверждение пароля</label>
                                <input
                                    type="password"
                                    name="confirm_password"
                                    value={formData.confirm_password}
                                    onChange={handleChange}
                                    className={errors.confirm_password ? 'form-input-error' : ''}
                                    required
                                />
                                {errors.confirm_password && <div className="form-error">{errors.confirm_password}</div>}
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3><i className="fas fa-building"></i> Информация о компании</h3>
                        <div className="form-group">
                            <label className="required-field">Название компании</label>
                            <input
                                type="text"
                                name="company_name"
                                value={formData.company_name}
                                onChange={handleChange}
                                className={errors.company_name ? 'form-input-error' : ''}
                                required
                            />
                            {errors.company_name && <div className="form-error">{errors.company_name}</div>}
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="required-field">ИНН</label>
                                <input
                                    type="text"
                                    name="inn"
                                    value={formData.inn}
                                    onChange={handleChange}
                                    className={errors.inn ? 'form-input-error' : ''}
                                    required
                                />
                                {errors.inn && <div className="form-error">{errors.inn}</div>}
                            </div>
                            <div className="form-group">
                                <label className="required-field">КПП</label>
                                <input
                                    type="text"
                                    name="kpp"
                                    value={formData.kpp}
                                    onChange={handleChange}
                                    className={errors.kpp ? 'form-input-error' : ''}
                                    required
                                />
                                {errors.kpp && <div className="form-error">{errors.kpp}</div>}
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="required-field">ОГРН</label>
                            <input
                                type="text"
                                name="ogrn"
                                value={formData.ogrn}
                                onChange={handleChange}
                                className={errors.ogrn ? 'form-input-error' : ''}
                                required
                            />
                            {errors.ogrn && <div className="form-error">{errors.ogrn}</div>}
                        </div>
                        <div className="form-group">
                            <label className="required-field">Телефон</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className={errors.phone ? 'form-input-error' : ''}
                                required
                            />
                            {errors.phone && <div className="form-error">{errors.phone}</div>}
                        </div>
                    </div>
                </div>

                <div className="form-column">
                    <div className="form-section">
                        <h3><i className="fas fa-user-tie"></i> Контактная информация</h3>
                        <div className="form-group">
                            <label>Контактное лицо</label>
                            <input
                                type="text"
                                name="contact_person"
                                value={formData.contact_person}
                                onChange={handleChange}
                                className={errors.contact_person ? 'form-input-error' : ''}
                            />
                            {errors.contact_person && <div className="form-error">{errors.contact_person}</div>}
                        </div>
                        <div className="form-group">
                            <label>Должность</label>
                            <input
                                type="text"
                                name="position"
                                value={formData.position}
                                onChange={handleChange}
                                className={errors.position ? 'form-input-error' : ''}
                            />
                            {errors.position && <div className="form-error">{errors.position}</div>}
                        </div>
                        <div className="form-group">
                            <label className="required-field">Юридический адрес</label>
                            <textarea
                                name="legal_address"
                                value={formData.legal_address}
                                onChange={handleChange}
                                className={errors.legal_address ? 'form-input-error' : ''}
                                required
                                rows="3"
                            />
                            {errors.legal_address && <div className="form-error">{errors.legal_address}</div>}
                        </div>
                        <div className="form-group">
                            <label>Фактический адрес</label>
                            <textarea
                                name="actual_address"
                                value={formData.actual_address}
                                onChange={handleChange}
                                className={errors.actual_address ? 'form-input-error' : ''}
                                rows="3"
                            />
                            {errors.actual_address && <div className="form-error">{errors.actual_address}</div>}
                        </div>
                    </div>

                    <div className="form-section">
                        <h3><i className="fas fa-university"></i> Банковские реквизиты</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label>БИК</label>
                                <input
                                    type="text"
                                    name="bik"
                                    value={formData.bik}
                                    onChange={handleChange}
                                    className={errors.bik ? 'form-input-error' : ''}
                                />
                                {errors.bik && <div className="form-error">{errors.bik}</div>}
                            </div>
                            <div className="form-group">
                                <label>Номер счета</label>
                                <input
                                    type="text"
                                    name="account_number"
                                    value={formData.account_number}
                                    onChange={handleChange}
                                    className={errors.account_number ? 'form-input-error' : ''}
                                />
                                {errors.account_number && <div className="form-error">{errors.account_number}</div>}
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Название банка</label>
                            <input
                                type="text"
                                name="bank_name"
                                value={formData.bank_name}
                                onChange={handleChange}
                                className={errors.bank_name ? 'form-input-error' : ''}
                            />
                            {errors.bank_name && <div className="form-error">{errors.bank_name}</div>}
                        </div>
                        <div className="form-group">
                            <label>Тип подписи</label>
                            <select
                                name="signature_type"
                                value={formData.signature_type}
                                onChange={handleChange}
                                className={errors.signature_type ? 'form-input-error' : ''}
                            >
                                <option value="">Выберите тип подписи</option>
                                <option value="simple">Простая</option>
                                <option value="qualified">Квалифицированная</option>
                            </select>
                            {errors.signature_type && <div className="form-error">{errors.signature_type}</div>}
                        </div>
                    </div>

                    <div className="form-section">
                        <h3><i className="fas fa-file-alt"></i> Документы</h3>
                        <div className="form-group">
                            <label>Учредительные документы</label>
                            <input
                                type="file"
                                name="documents"
                                onChange={handleFileChange}
                                className={errors.documents ? 'form-input-error' : ''}
                                accept=".pdf,.jpg,.jpeg,.png"
                            />
                            <div className="form-hint">Поддерживаемые форматы: PDF, JPG, PNG (до 5MB)</div>
                            {errors.documents && <div className="form-error">{errors.documents}</div>}
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
                <button type="submit" className="btn-primary">
                    Зарегистрироваться
                </button>
            </div>
        </form>
    );
}

export default LegalProfile; 