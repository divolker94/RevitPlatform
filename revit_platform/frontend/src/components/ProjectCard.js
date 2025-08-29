import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import './ProjectCard.css';
import { useNavigate } from 'react-router-dom';
import AddToOrderButton from './AddToOrderButton';
import { FaShoppingCart } from 'react-icons/fa';

const ProjectCard = ({ project }) => {
    const [imageError, setImageError] = useState(false);
    const [imagePath, setImagePath] = useState('');
    const [userRating, setUserRating] = useState(project.user_rating || 0);
    const [projectRating, setProjectRating] = useState({
        average: project.rating_average || 0,
        count: project.rating_count || 0
    });

    const formatPrice = (price) => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            maximumFractionDigits: 0
        }).format(price);
    };

    useEffect(() => {
        const path = `/images/catalog/3d_view_${project.id}.png`;
        setImagePath(path);
        console.log('Project ID:', project.id);
        console.log('Image path:', path);
        
        // Проверяем существование файла
        fetch(path)
            .then(response => {
                console.log('Image fetch response:', response.status);
                if (!response.ok) {
                    throw new Error('Image not found');
                }
            })
            .catch(error => {
                console.error('Image fetch error:', error);
                setImageError(true);
            });
    }, [project.id]);

    const handleImageError = (e) => {
        console.log('Image load failed:', e.target.src);
        setImageError(true);
        e.target.src = '/images/catalog/placeholder-project.png';
    };

    const navigate = useNavigate();

    const handleCardClick = () => {
        navigate(`/architectural-projects/${project.id}`);
    };

    const handleRatingClick = async (rating, e) => {
        e.stopPropagation();
        
        // Проверяем авторизацию
        const token = localStorage.getItem('access_token');
        if (!token) {
            alert('Для оценки проектов необходимо войти в систему');
            return;
        }

        try {
            const response = await axios.post(
                `http://localhost:8000/api/architectural-projects/${project.id}/rate/`,
                { rating },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    }
                }
            );

            // Обновляем локальное состояние
            setUserRating(rating);
            setProjectRating({
                average: response.data.project_rating_average,
                count: response.data.project_rating_count
            });

            console.log('Rating updated successfully:', response.data);
        } catch (err) {
            console.error('Error updating rating:', err);
            if (err.response?.status === 401) {
                alert('Необходимо войти в систему для оценки проектов');
            } else {
                alert('Ошибка при обновлении рейтинга');
            }
        }
    };

    return (
        <div className="project-card" onClick={handleCardClick}>
            <div className="project-image">
                {/* Название проекта в верхнем углу изображения */}
                <div className="project-title-overlay">
                    <span className="project-title-text">{project.name}</span>
                </div>
                
                {imageError && (
                    <div className="image-error">
                        Ошибка загрузки изображения
                        <br />
                        <small>{imagePath}</small>
                    </div>
                )}
                <img 
                    src={imagePath}
                    alt={project.name}
                    onError={handleImageError}
                />
            </div>
            <div className="project-info">
                <p className="project-type">{project.category}</p>
                
                {/* Компактная компоновка: площадь, цена и статистика в 2 строчки */}
                <div className="project-compact-layout">
                    {/* Первая строка: площадь и цена */}
                    <div className="project-metrics">
                        <span className="project-area">
                            <i className="fas fa-ruler-combined"></i>
                            {project.total_area} м²
                        </span>
                        <span className="project-price">
                            {formatPrice(project.design_cost)}
                        </span>
                    </div>
                    
                    {/* Вторая строка: статистика и рейтинг */}
                    <div className="project-bottom-row">
                        <div className="project-stats">
                            <span title="Просмотры">
                                <i className="far fa-eye"></i> {project.views_count || 0}
                            </span>
                            <span title="Загрузки">
                                <i className="fas fa-download"></i> {project.downloads || 0}
                            </span>
                            <span title="Комментарии">
                                <i className="far fa-comment"></i> {project.user_comments || 0}
                            </span>
                        </div>
                        
                        {/* Компактный рейтинг */}
                        <div className="compact-rating">
                            <div className="rating-stars-compact">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                        key={star}
                                        className={`star-compact ${star <= userRating ? 'filled' : ''}`}
                                        onClick={(e) => handleRatingClick(star, e)}
                                        title={`Оценить ${star} звездой`}
                                    >
                                        ★
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Информация о рейтинге (если есть) */}
                {projectRating.count > 0 && (
                    <div className="rating-info-compact">
                        <span className="rating-average">Средний: {projectRating.average}/5</span>
                        <span className="rating-count">({projectRating.count})</span>
                    </div>
                )}
            </div>
        </div>
    );
};

ProjectCard.propTypes = {
    project: PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        category: PropTypes.string.isRequired,
        total_area: PropTypes.number.isRequired,
        design_cost: PropTypes.number.isRequired,
        downloads: PropTypes.number,
        user_comments: PropTypes.number,
        views_count: PropTypes.number,
        rating_average: PropTypes.number,
        rating_count: PropTypes.number,
        user_rating: PropTypes.number
    }).isRequired
};

export default ProjectCard;