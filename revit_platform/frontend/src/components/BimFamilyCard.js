import React, { useState, useEffect } from 'react';
import { FaShoppingCart, FaEye } from 'react-icons/fa';
import './BimFamilyCard.css';
import AddToOrderButton from './AddToOrderButton';
import { useNavigate } from 'react-router-dom';

const BimFamilyCard = ({ family, onCardClick }) => {
    const [imageError, setImageError] = useState(false);
    const [views, setViews] = useState(family.views || 0);
    const [rating, setRating] = useState(family.rating || 0);
    const [userData, setUserData] = useState(null);
    const navigate = useNavigate();
    
    // Получаем первое изображение для превью
    const getPreviewImage = () => {
        // Если есть изображения в API, используем первое
        if (family.images && family.images.length > 0) {
            return family.images[0];
        }
        
        // Если нет изображений в API, создаем путь к первому изображению в папке семейства
        // Формируем ID папки с ведущими нулями (например, 1 -> 00001)
        const folderId = family.id.toString().padStart(5, '0');
        return {
            local_path: `images/bim_families/${folderId}/image_1_ВС_125х82.jpg`
        };
    };
    
    const previewImage = getPreviewImage();
    
    // Логируем информацию об изображении для отладки
    console.log('BimFamilyCard render:', {
        familyName: family.name,
        familyId: family.id,
        category: family.category?.name,
        familyType: family.family_type,
        manufacturer: family.manufacturer,
        imagesCount: family.images?.length || 0,
        previewImage: previewImage,
        previewImagePath: previewImage?.local_path
    });

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
    
    const handleImageError = (e) => {
        console.log('Image load error for:', e.target.src);
        console.log('Family:', family.name);
        console.log('Image path:', previewImage?.local_path);
        setImageError(true);
        
        // Пробуем загрузить другое изображение из папки семейства
        const currentSrc = e.target.src;
        const folderId = family.id.toString().padStart(5, '0');
        
        if (currentSrc.includes(`/images/bim_families/${folderId}/`)) {
            // Если это первое изображение, пробуем второе
            if (currentSrc.includes('image_1')) {
                e.target.src = `/images/bim_families/${folderId}/image_2_1.jpg`;
            } else if (currentSrc.includes('image_2')) {
                e.target.src = `/images/bim_families/${folderId}/image_3_2.jpg`;
            } else if (currentSrc.includes('image_3')) {
                e.target.src = `/images/bim_families/${folderId}/image_4_3.jpg`;
            } else {
                // Если все не работает, используем placeholder
                e.target.src = '/images/bim_families/placeholder-family.png';
            }
        } else {
            e.target.src = '/images/bim_families/placeholder-family.png';
        }
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

    const handleDetailClick = (e) => {
        e.stopPropagation();
        navigate(`/bim-families/${family.id}`);
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
            return '/images/bim_families/placeholder-family.png';
        }
        
        // Если путь уже содержит полный URL
        if (imagePath.startsWith('http')) {
            console.log('getImagePath: Full URL detected:', imagePath);
            return imagePath;
        }
        
        // Если путь уже содержит полный путь к изображению
        if (imagePath.startsWith('/images/')) {
            console.log('getImagePath: Full image path detected:', imagePath);
            return imagePath;
        }
        
        // Создаем правильный путь к изображению в папке семейства
        // Формируем ID папки с ведущими нулями (например, 1 -> 00001)
        const folderId = family.id.toString().padStart(5, '0');
        const finalPath = `/images/bim_families/${folderId}/${imagePath}`;
        console.log('getImagePath: Constructed BIM family path:', finalPath);
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
    
    // Функция для отображения звезд рейтинга (как в архитектурных проектах)
    const renderStars = () => {
        const stars = [];
        const fullRating = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        
        for (let i = 0; i < 5; i++) {
            let starClass = 'star-compact';
            
            if (i < fullRating) {
                starClass += ' filled';
            } else if (i === fullRating && hasHalfStar) {
                starClass += ' half-filled';
            }
            
            stars.push(
                <span 
                    key={i} 
                    className={starClass}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleRatingClick(i + 1);
                    }}
                    title={`Оценить ${i + 1} звездой`}
                >
                    ★
                </span>
            );
        }
        
        return stars;
    };
    
    return (
        <div className="bim-family-card">
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
                        
                        {/* Компактный рейтинг (как в архитектурных проектах) */}
                        <div className="compact-rating">
                            <div className="rating-stars-compact">
                                {renderStars()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Кнопки действий */}
                <div className="family-actions">
                    {/* Кнопка "В заказ" */}
                    <AddToOrderButton
                        itemType="bim_family"
                        itemId={family.id}
                        itemName={family.name}
                        itemCost={family.cost || 0}
                        itemArea={family.area || 0}
                        itemCategory={family.category?.name || family.family_type}
                    />
                    
                    {/* Кнопка "Ознакомиться" */}
                    <button 
                        className="detail-btn"
                        onClick={handleDetailClick}
                        title="Ознакомиться"
                    >
                        <FaEye />
                        <span>Ознакомиться</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BimFamilyCard;
