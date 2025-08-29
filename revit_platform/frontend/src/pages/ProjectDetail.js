import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import AddToOrderButton from '../components/AddToOrderButton';
import './ProjectDetail.css';

function ProjectDetail() {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [rating, setRating] = useState(0);
    const [userRating, setUserRating] = useState(0);
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const response = await axios.get(`http://localhost:8000/api/architectural-projects/${id}/`, {
                    withCredentials: true,
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    }
                });
                setProject(response.data);
                setRating(Number(response.data.rating_average) || 0);
                setUserRating(Number(response.data.user_rating) || 0);
            } catch (err) {
                setError(err.response?.data?.detail || 'Ошибка при загрузке проекта');
            } finally {
                setLoading(false);
            }
        };

        fetchProject();
    }, [id]);

    // Загружаем данные пользователя
    useEffect(() => {
        const loadUserData = async () => {
            const token = localStorage.getItem('access_token');
            if (token) {
                try {
                    const response = await fetch('http://localhost:8000/api/auth/users/me/', {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setUserData(data);
                    }
                } catch (error) {
                    console.error('Error loading user data:', error);
                }
            }
        };
        loadUserData();
    }, []);

    const handleRating = async (newRating) => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                alert('Для оценки проектов необходимо войти в систему');
                return;
            }

            const response = await axios.post(`http://localhost:8000/api/architectural-projects/${id}/rate/`, {
                rating: newRating
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                }
            });

            // Обновляем локальное состояние
            setUserRating(newRating);
            setRating(Number(response.data.project_rating_average) || 0);
            
            // Обновляем проект с новыми данными рейтинга
            setProject(prev => ({
                ...prev,
                rating_average: response.data.project_rating_average,
                rating_count: response.data.project_rating_count
            }));

        } catch (err) {
            console.error('Error updating rating:', err);
            if (err.response?.status === 401) {
                alert('Необходимо войти в систему для оценки проектов');
            } else {
                alert('Ошибка при обновлении рейтинга');
            }
        }
    };

    if (loading) return <div className="loading">Загрузка...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!project) return <div className="error">Проект не найден</div>;

    return (
        <div className="project-detail">
            {/* Фоновое изображение */}
            <div className="project-detail-background"></div>
            
            <div className="project-header">
                <h1>{project.name}</h1>
                <div className="project-rating">
                    <div className="rating-info">
                        <span className="rating-average">Средний рейтинг: {(Number(rating) || 0).toFixed(1)}/5</span>
                        <span className="rating-count">({project.rating_count || 0} оценок)</span>
                    </div>
                    <div className="stars-container">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <span
                                key={star}
                                className={`star ${star <= (Number(userRating) || 0) ? 'filled' : ''}`}
                                onClick={() => handleRating(star)}
                                title={`Оценить ${star} звездой`}
                            >
                                ★
                            </span>
                        ))}
                    </div>
                    {(Number(userRating) || 0) > 0 && (
                        <div className="user-rating-info">
                            Ваша оценка: {Number(userRating) || 0}/5
                        </div>
                    )}
                </div>
            </div>

            <div className="project-image">
                <img 
                    src={`/images/catalog/3d_view_${project.id}.png`}
                    alt={project.name}
                    onError={(e) => {
                        e.target.src = '/images/catalog/placeholder-project.png';
                    }}
                />
            </div>

            <div className="project-info-grid">
                <div className="info-item">
                    <h3>Категория</h3>
                    <p>{project.category}</p>
                </div>
                <div className="info-item">
                    <h3>Функциональный класс</h3>
                    <p>{project.functional_class}</p>
                </div>
                <div className="info-item">
                    <h3>Конструктивная система</h3>
                    <p>{project.construction_system}</p>
                </div>
                <div className="info-item">
                    <h3>Общая площадь</h3>
                    <p>{project.total_area} м²</p>
                </div>
                <div className="info-item">
                    <h3>Объем здания</h3>
                    <p>{project.building_volume} м³</p>
                </div>
                <div className="info-item">
                    <h3>Площадь застройки</h3>
                    <p>{project.footprint_area} м²</p>
                </div>
                <div className="info-item">
                    <h3>Длительность проектирования</h3>
                    <p>{project.design_duration} дней</p>
                </div>
                <div className="info-item">
                    <h3>Стоимость проектирования</h3>
                    <p>{new Intl.NumberFormat('ru-RU', {
                        style: 'currency',
                        currency: 'RUB',
                        maximumFractionDigits: 0
                    }).format(project.design_cost)}</p>
                </div>
            </div>

            <div className="project-description">
                <h2>Описание проекта</h2>
                <p>{project.description || 'Описание отсутствует'}</p>
            </div>

            <div className="project-actions">
                <AddToOrderButton
                    itemType="architectural"
                    itemId={project.id}
                    itemName={project.name}
                    itemCost={project.design_cost}
                    itemArea={project.total_area}
                    itemCategory={project.category}
                />
            </div>

            <div className="project-documentation">
                <h2>Документация</h2>
                <p>{project.documentation || 'Документация отсутствует'}</p>
            </div>



            <div className="project-specs">
                <h2>Технические характеристики</h2>
                <ul>
                    <li><strong>Этажность:</strong> {project.floors || 'Не указано'}</li>
                    <li><strong>Материал стен:</strong> {project.wall_material || 'Не указано'}</li>
                    <li><strong>Тип фундамента:</strong> {project.foundation_type || 'Не указано'}</li>
                    <li><strong>Тип кровли:</strong> {project.roof_type || 'Не указано'}</li>
                </ul>
            </div>

            {project.additional_info && (
                <div className="additional-info">
                    <h2>Дополнительная информация</h2>
                    <p>{project.additional_info}</p>
                </div>
            )}
        </div>
    );
}

export default ProjectDetail;