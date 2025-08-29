import React, { useState } from 'react';
import { FaDownload } from 'react-icons/fa';
import './BimFamilyCard.css';
import AddToOrderButton from './AddToOrderButton';

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
        category: family.category?.name,
        familyType: family.family_type,
        manufacturer: family.manufacturer,
        imagesCount: family.images?.length || 0,
        previewImage: previewImage,
        previewImagePath: previewImage?.image
    });
    
    const handleImageError = (e) => {
        console.log('Image load error for:', e.target.src);
        console.log('Family:', family.name);
        console.log('Image path:', previewImage?.image);
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
    
    // Получаем категорию из модели
    const getCategory = () => {
        // Теперь категория хранится в поле category
        if (family.category?.name) {
            return family.category.name;
        }
        
        // Fallback на family_type если категория не указана
        if (family.family_type && family.family_type !== 'Не указан') {
            return family.family_type;
        }
        
        return null;
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
        
        return finalPath;
    };
    
    // Обработчик скачивания
    const handleDownload = (e) => {
        e.stopPropagation(); // Предотвращаем всплытие события
        
        // Здесь можно добавить логику скачивания
        // Например, открыть ссылку на скачивание или показать модальное окно
        console.log('Download requested for:', family.name);
        
        // Временное решение - показываем уведомление
        alert(`Скачивание ${family.name} будет доступно в ближайшее время`);
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
                        src={getImagePath(previewImage.image)}
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
                {/* Показываем тип и производителя */}
                <div className="family-meta">
                    {family.family_type && family.family_type !== 'Не указан' && (
                        <p className="family-type">{family.family_type}</p>
                    )}
                    {family.manufacturer && family.manufacturer !== 'Не указан' && (
                        <p className="family-manufacturer">{family.manufacturer}</p>
                    )}
                </div>
                
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
                                {family.downloads_count || 0}
                            </span>
                            <span className="stat-item">
                                <i className="fas fa-star"></i>
                                {family.rating || 0}
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
                <div className="family-actions">
                    <button 
                        className="download-btn"
                        onClick={handleDownload}
                        title="Скачать"
                    >
                        <FaDownload />
                        <span>Скачать</span>
                    </button>
                    <AddToOrderButton
                        itemType="bim_family"
                        itemId={family.id}
                        itemName={family.name}
                        itemCost={family.cost}
                        itemArea={family.area}
                        itemCategory={family.category?.name || family.family_type}
                    />
                </div>
            </div>
        </div>
    );
};

export default BimFamilyCard;
