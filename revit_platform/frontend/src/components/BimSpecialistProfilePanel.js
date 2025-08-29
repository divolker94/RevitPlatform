import React, { useState, useEffect } from 'react';
import ProfilePanel from './ProfilePanel';
import './ProfilePanel.css';

const BimSpecialistProfilePanel = ({ userData, onSave }) => {
    const [profileData, setProfileData] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        specialization: [],
        experience: '',
        work_type: [],
        availability: '',
        hourly_rate: '',
        about: '',
        linkedin: '',
        website: ''
    });

    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (userData) {
            setProfileData({
                first_name: userData.first_name || '',
                last_name: userData.last_name || '',
                phone: userData.phone || '',
                specialization: userData.specialization || [],
                experience: userData.experience || '',
                work_type: userData.work_type || [],
                availability: userData.availability || '',
                hourly_rate: userData.hourly_rate || '',
                about: userData.about || '',
                linkedin: userData.linkedin || '',
                website: userData.website || ''
            });
        }
    }, [userData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        try {
            await onSave(profileData);
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving profile:', error);
        }
    };

    const specializations = [
        'Архитектурное проектирование',
        'Конструктивные решения',
        'Инженерные системы',
        'BIM-координация',
        'BIM-менеджмент',
        'Визуализация',
        'Энергомоделирование',
        'Управление проектами'
    ];

    const workTypes = [
        'Полная занятость',
        'Частичная занятость',
        'Проектная работа',
        'Консультации',
        'Удаленная работа'
    ];

    return (
        <div className="bim-specialist-profile">
            {/* Панель основной информации */}
            <ProfilePanel 
                title="Основная информация" 
                icon="fas fa-user"
                className="main-info-panel"
            >
                <div className="form-grid">
                    <div className="form-group">
                        <label>Имя</label>
                        <input
                            type="text"
                            name="first_name"
                            value={profileData.first_name}
                            onChange={handleChange}
                            disabled={!isEditing}
                        />
                    </div>
                    <div className="form-group">
                        <label>Фамилия</label>
                        <input
                            type="text"
                            name="last_name"
                            value={profileData.last_name}
                            onChange={handleChange}
                            disabled={!isEditing}
                        />
                    </div>
                    <div className="form-group">
                        <label>Телефон</label>
                        <input
                            type="tel"
                            name="phone"
                            value={profileData.phone}
                            onChange={handleChange}
                            disabled={!isEditing}
                        />
                    </div>
                </div>
            </ProfilePanel>

            {/* Панель профессиональной информации */}
            <ProfilePanel 
                title="Профессиональная информация" 
                icon="fas fa-briefcase"
                className="professional-info-panel"
            >
                <div className="form-grid">
                    <div className="form-group">
                        <label>Специализация</label>
                        <div className="checkbox-grid">
                            {specializations.map(spec => (
                                <label key={spec} className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={profileData.specialization.includes(spec)}
                                        onChange={() => {
                                            const newSpecs = profileData.specialization.includes(spec)
                                                ? profileData.specialization.filter(s => s !== spec)
                                                : [...profileData.specialization, spec];
                                            setProfileData(prev => ({ ...prev, specialization: newSpecs }));
                                        }}
                                        disabled={!isEditing}
                                    />
                                    <span>{spec}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label>Опыт работы (лет)</label>
                        <input
                            type="number"
                            name="experience"
                            value={profileData.experience}
                            onChange={handleChange}
                            disabled={!isEditing}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Тип работы</label>
                        <div className="checkbox-grid">
                            {workTypes.map(type => (
                                <label key={type} className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={profileData.work_type.includes(type)}
                                        onChange={() => {
                                            const newTypes = profileData.work_type.includes(type)
                                                ? profileData.work_type.filter(t => t !== type)
                                                : [...profileData.work_type, type];
                                            setProfileData(prev => ({ ...prev, work_type: newTypes }));
                                        }}
                                        disabled={!isEditing}
                                    />
                                    <span>{type}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </ProfilePanel>

            {/* Панель условий работы */}
            <ProfilePanel 
                title="Условия работы" 
                icon="fas fa-clock"
                className="work-conditions-panel"
            >
                <div className="form-grid">
                    <div className="form-group">
                        <label>Доступность</label>
                        <input
                            type="text"
                            name="availability"
                            value={profileData.availability}
                            onChange={handleChange}
                            placeholder="Например: 40 часов в неделю"
                            disabled={!isEditing}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Часовая ставка (₽)</label>
                        <input
                            type="number"
                            name="hourly_rate"
                            value={profileData.hourly_rate}
                            onChange={handleChange}
                            disabled={!isEditing}
                        />
                    </div>
                </div>
            </ProfilePanel>

            {/* Панель дополнительной информации */}
            <ProfilePanel 
                title="Дополнительная информация" 
                icon="fas fa-info-circle"
                className="additional-info-panel"
            >
                <div className="form-group">
                    <label>О себе</label>
                    <textarea
                        name="about"
                        value={profileData.about}
                        onChange={handleChange}
                        placeholder="Расскажите о своем опыте и навыках..."
                        disabled={!isEditing}
                        rows="4"
                    />
                </div>
                
                <div className="form-grid">
                    <div className="form-group">
                        <label>LinkedIn</label>
                        <input
                            type="url"
                            name="linkedin"
                            value={profileData.linkedin}
                            onChange={handleChange}
                            placeholder="https://linkedin.com/in/..."
                            disabled={!isEditing}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Веб-сайт</label>
                        <input
                            type="url"
                            name="website"
                            value={profileData.website}
                            onChange={handleChange}
                            placeholder="https://..."
                            disabled={!isEditing}
                        />
                    </div>
                </div>
            </ProfilePanel>

            {/* Кнопки действий */}
            <div className="profile-actions">
                {!isEditing ? (
                    <button 
                        className="btn btn-primary"
                        onClick={() => setIsEditing(true)}
                    >
                        <i className="fas fa-edit"></i>
                        Редактировать профиль
                    </button>
                ) : (
                    <div className="action-buttons">
                        <button 
                            className="btn btn-success"
                            onClick={handleSave}
                        >
                            <i className="fas fa-save"></i>
                            Сохранить изменения
                        </button>
                        <button 
                            className="btn btn-secondary"
                            onClick={() => setIsEditing(false)}
                        >
                            <i className="fas fa-times"></i>
                            Отмена
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BimSpecialistProfilePanel;
