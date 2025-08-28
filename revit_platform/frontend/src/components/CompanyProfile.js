import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfileForms.css';
import clientsService from '../services/clients';
import authService from '../services/auth.service';

function CompanyProfile({ onSubmit }) {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        company_name: '',
        inn: '',
        phone: '',
        kpp: '',
        ogrn: '',
        bik: '',
        account_number: '',
        bank_name: '',
        legalAddress: '',
        actualAddress: '',
        contactPerson: '',
        position: '',
        signature_type: ''
    });

    const limits = { inn: 12, kpp: 9, bik: 9, account_number: 20, phone: 20 };

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
        let v = value;
        if (['inn','kpp','bik','account_number','phone'].includes(name)) {
            v = v.replace(/\D/g, '');
            if (limits[name]) v = v.slice(0, limits[name]);
        }
        setFormData(prev => ({
            ...prev,
            [name]: v
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Простая валидация обязательных полей
        const requiredFields = [
            'company_name', 'inn', 'kpp', 'ogrn',
            'bik', 'account_number', 'bank_name',
            'contactPerson', 'phone'
        ];
        const missing = requiredFields.filter(f => !formData[f] || String(formData[f]).trim() === '');
        if (missing.length) {
            alert('Заполните обязательные поля: ' + missing.join(', '));
            return;
        }

        try {
            // Подготовка данных под поля бэкенда (snake_case)
            const payload = {
                company_name: formData.company_name,
                inn: formData.inn,
                kpp: formData.kpp,
                ogrn: formData.ogrn,
                bik: formData.bik,
                account_number: formData.account_number,
                bank_name: formData.bank_name,
                contact_person: formData.contactPerson,
                phone: formData.phone,
                legal_address: formData.legalAddress || null,
                actual_address: formData.actualAddress || null,
                position: formData.position || null,
                signature_type: formData.signature_type || null
            };

            const response = await clientsService.createLegalEntity(payload);
            
            console.log('Статус ответа:', response.status);
            console.log('Ответ сервера:', response.data);
            
            if (onSubmit) {
                onSubmit(response.data);
            }
            
            // Показываем сообщение об успехе и кнопку перехода к профилю
            alert('Компания успешно зарегистрирована! Теперь вы можете перейти к своему профилю.');
        } catch (error) {
            console.error('Error creating company:', error);
            if (error.response) {
                console.error('Детали ошибки:', error.response.data);
                alert(`Ошибка ${error.response.status}: ${error.response.data.detail || error.response.data.message || 'Неизвестная ошибка'}`);
            } else {
                alert('Ошибка при создании компании: ' + error.message);
            }
        }
    };

    return (
        <form className="profile-form" onSubmit={handleSubmit}>
            <h2>Регистрация компании</h2>
            
            <section className="form-section">
                <h3>Основная информация</h3>
                
                <div className="form-group">
                    <label className="required-field">Полное название организации</label>
                    <input
                        type="text"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="required-field">ИНН</label>
                        <input
                            type="text"
                            name="inn"
                            value={formData.inn}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label className="required-field">КПП</label>
                        <input
                            type="text"
                            name="kpp"
                            value={formData.kpp}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label className="required-field">ОГРН</label>
                    <input
                        type="text"
                        name="ogrn"
                        value={formData.ogrn}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="required-field">БИК</label>
                        <input
                            type="text"
                            name="bik"
                            value={formData.bik}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="required-field">Расчётный счёт</label>
                        <input
                            type="text"
                            name="account_number"
                            value={formData.account_number}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label className="required-field">Банк</label>
                    <input
                        type="text"
                        name="bank_name"
                        value={formData.bank_name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Юридический адрес</label>
                    <input
                        type="text"
                        name="legalAddress"
                        value={formData.legalAddress}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label>Фактический адрес</label>
                    <input
                        type="text"
                        name="actualAddress"
                        value={formData.actualAddress}
                        onChange={handleChange}
                    />
                </div>
            </section>

            <section className="form-section">
                <h3>Контактная информация</h3>
                
                <div className="form-group">
                    <label className="required-field">ФИО контактного лица</label>
                    <input
                        type="text"
                        name="contactPerson"
                        value={formData.contactPerson}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Должность</label>
                    <input
                        type="text"
                        name="position"
                        value={formData.position}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label>Тип подписи</label>
                    <select
                        name="signature_type"
                        value={formData.signature_type}
                        onChange={handleChange}
                    >
                        <option value="">Выберите тип подписи</option>
                        <option value="electronic">Электронная подпись</option>
                        <option value="manual">Ручная подпись</option>
                        <option value="stamp">Печать</option>
                    </select>
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
            </section>

            <div className="form-required-hint">
                <span>*</span> Поля, обязательные для заполнения
            </div>

            <div className="form-actions">
                <button type="submit" className="btn-primary">
                    Зарегистрировать компанию
                </button>
                <button type="button" className="btn-secondary" onClick={() => navigate('/profile')}>
                    Перейти к профилю
                </button>
                <button type="button" className="btn-secondary">
                    Отмена
                </button>
            </div>
        </form>
    );
}

export default CompanyProfile;