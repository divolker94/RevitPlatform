import React, { useState } from 'react';
import './BimFamilyCard.css';

const BimFamilyCard = ({ family, onCardClick }) => {
    const [imageError, setImageError] = useState(false);
    const [views, setViews] = useState(family.views || 0);
    const [rating, setRating] = useState(family.rating || 0);
    
    // Получаем первое изображение для превью
    const previewImage = family.images && family.images.length > 0 
        ? family.images[0] 
        : null;
    
    // Логируем информацию об изображении для отладки
    console.log('BimFamilyCard render:', {
        familyName: family.name,
        familyId: family.id,
        externalId: family.external_id,
        totalImages: family.total_images,
        imagesCount: family.images?.length || 0,
        previewImage: previewImage,
        previewImagePath: previewImage?.local_path
    });
    
    const handleImageError = (e) => {
        console.log('Image load error for:', e.target.src);
        console.log('Family:', family.name);
        console.log('Image path:', previewImage?.local_path);
        setImageError(true);
        e.target.src = '/images/placeholder-family.png';
    };
    
    const handleCardClick = async () => {
        // Увеличиваем счетчик просмотров
        try {
            // Получаем токен авторизации, если пользователь залогинен
            const token = localStorage.getItem('access_token');
            const headers = {
                'Content-Type': 'application/json',
            };
            
            // Добавляем токен авторизации, если он есть
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch(`http://localhost:8000/api/bim-families/${family.id}/increment_views/`, {
                method: 'POST',
                headers: headers,
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setViews(data.views);
                }
            }
        } catch (error) {
            console.error('Error incrementing views:', error);
        }
        
        // Вызываем оригинальный обработчик
        if (onCardClick) {
            onCardClick(family);
        }
    };
    
    // Получаем категорию из технических характеристик
    const getCategory = () => {
        if (!family.technical_specs) return null;
        
        try {
            const specs = typeof family.technical_specs === 'string' 
                ? JSON.parse(family.technical_specs) 
                : family.technical_specs;
            
            return specs.Категория || specs.Тип || null;
        } catch {
            return null;
        }
    };
    
    // Функция для получения правильного пути к изображению
    const getImagePath = (imagePath) => {
        if (!imagePath) {
            console.log('getImagePath: No imagePath provided');
            return '/images/placeholder-family.png';
        }
        
        // Если путь уже содержит полный URL
        if (imagePath.startsWith('http')) {
            console.log('getImagePath: Full URL detected:', imagePath);
            return imagePath;
        }
        
        // Теперь путь уже содержит правильную структуру: images/bim_families/00001/filename.jpg
        // Просто добавляем слеш в начало
        const finalPath = `/${imagePath}`;
        console.log('getImagePath: Constructed path:', finalPath);
        console.log('getImagePath: Original path:', imagePath);
        
        return finalPath;
    };
    
    // Функция для установки рейтинга
    const handleRatingClick = async (newRating) => {
        try {
            const response = await fetch(`http://localhost:8000/api/bim-families/${family.id}/set_rating/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ rating: newRating }),
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setRating(data.rating);
                }
            }
        } catch (error) {
            console.error('Error setting rating:', error);
        }
    };
    
    // Функция для отображения звезд рейтинга
    const renderStars = () => {
        const stars = [];
        const fullRating = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        
        for (let i = 0; i < 5; i++) {
            let starClass = 'fas fa-star star-compact';
            
            if (i < fullRating) {
                starClass += ' filled';
            } else if (i === fullRating && hasHalfStar) {
                starClass = 'fas fa-star-half-alt star-compact filled';
            }
            
            stars.push(
                <i 
                    key={i} 
                    className={starClass}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleRatingClick(i + 1);
                    }}
                    style={{ cursor: 'pointer' }}
                ></i>
            );
        }
        
        return stars;
    };
    
    return (
        <div className="bim-family-card" onClick={handleCardClick}>
            <div className="family-image-container">
                {previewImage ? (
                    <img 
                        src={getImagePath(previewImage.local_path)}
                        alt={family.name}
                        className="family-image"
                        onError={handleImageError}
                    />
                ) : (
                    <div className="family-image-placeholder">
                        <i className="fas fa-cube"></i>
                    </div>
                )}
                
                {/* Название семейства в верхнем углу изображения */}
                <div className="family-title-overlay">
                    <span className="family-title-text">{family.name}</span>
                </div>
                
                {/* Категория в правом верхнем углу - показываем только если есть */}
                {getCategory() && (
                    <div className="family-category-overlay">
                        <span className="category-badge">{getCategory()}</span>
                    </div>
                )}
            </div>
            
            <div className="family-info">
                {/* Показываем тип только если есть категория */}
                {getCategory() && (
                    <p className="family-type">{getCategory()}</p>
                )}
                
                {/* Компактная компоновка: описание и статистика */}
                <div className="family-compact-layout">
                    {/* Описание */}
                    <div className="family-description">
                        {family.description && family.description.length > 80 
                            ? `${family.description.substring(0, 80)}...` 
                            : family.description}
                    </div>
                    
                    {/* Статистика и рейтинг внизу */}
                    <div className="family-bottom-row">
                        <div className="family-stats">
                            <span className="stat-item">
                                <i className="fas fa-eye"></i>
                                {views}
                            </span>
                            <span className="stat-item">
                                <i className="fas fa-download"></i>
                                {family.downloads || 0}
                            </span>
                            <span className="stat-item">
                                <i className="fas fa-comment"></i>
                                {family.comments || 0}
                            </span>
                        </div>
                        
                        {/* Компактный рейтинг */}
                        <div className="compact-rating">
                            <div className="rating-stars-compact">
                                {[...Array(5)].map((_, i) => (
                                    <i 
                                        key={i} 
                                        className={`fas fa-star star-compact ${i < Math.floor(family.rating || 0) ? 'filled' : ''}`}
                                    ></i>
                                ))}
                            </div>
                            <span className="rating-average">{family.rating || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BimFamilyCard;
