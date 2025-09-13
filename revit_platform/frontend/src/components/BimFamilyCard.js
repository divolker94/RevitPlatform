import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import './ProjectCard.css'; // Используем те же стили, что и для архитектурных проектов
import { useNavigate } from 'react-router-dom';
import AddToOrderButton from './AddToOrderButton';
import { FaShoppingCart, FaEye } from 'react-icons/fa';

const BimFamilyCard = ({ family }) => {
    const [imageError, setImageError] = useState(false);
    const [imagePath, setImagePath] = useState('');
    const [userRating, setUserRating] = useState(family.user_rating || 0);
    const [familyRating, setFamilyRating] = useState({
        average: family.rating_average || family.rating || 0,
        count: family.rating_count || 0
    });
    const [userData, setUserData] = useState(null);

    const formatPrice = (price) => {
        if (!price || price === 0) return 'Бесплатно';
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            maximumFractionDigits: 0
        }).format(price);
    };

    // Улучшенная функция для умного поиска изображений в папке семейства
    const findAvailableImage = (folderId, startIndex = 1) => {
        const maxImages = 20; // Увеличиваем максимальное количество изображений
        
        // Приоритет расширений (сначала jpg, потом png, потом svg)
        const prioritizedExtensions = ['.jpg', '.jpeg', '.png', '.svg'];
        
        // Генерируем возможные пути изображений
        const possiblePaths = [];
        
        for (let i = startIndex; i <= maxImages; i++) {
            for (const ext of prioritizedExtensions) {
                possiblePaths.push(`/images/bim_families/${folderId}/image_${i}_${i-1}${ext}`);
            }
        }
        
        // Возвращаем первый путь (фронтенд будет проверять его загрузкой)
        // Если изображение не загрузится, сработает onError и попробуем следующий
        return possiblePaths[0] || '/images/bim_families/placeholder-family.png';
    };

    // Функция для определения лучшего изображения для семейства
    const getBestImageForFamily = () => {
        const folderId = family.id.toString().padStart(5, '0');
        
        // Если у семейства есть изображения в базе данных, используем их
        if (family.images && family.images.length > 0) {
            const firstImage = family.images[0];
            if (firstImage.image) {
                return firstImage.image;
            }
        }
        
        // Иначе используем локальные изображения из папки
        // Начинаем с оптимального изображения (image_1_0)
        return getOptimalImage(folderId);
    };

    // Функция для определения следующего изображения с учетом приоритетов
    const getNextImage = (currentSrc, folderId) => {
        const match = currentSrc.match(/image_(\d+)_(\d+)\.(jpg|png|svg|jpeg)$/);
        if (!match) return null;
        
        const currentIndex = parseInt(match[1]);
        const currentExt = match[3];
        
        // Сначала пробуем то же расширение с следующим номером
        const nextIndex = currentIndex + 1;
        if (nextIndex <= 20) {
            return `/images/bim_families/${folderId}/image_${nextIndex}_${nextIndex-1}.${currentExt}`;
        }
        
        return null;
    };

    // Функция для определения лучшего изображения с учетом приоритетов
    const getOptimalImage = (folderId) => {
        // Приоритет расширений для лучшего качества
        const extensions = ['.jpg', '.jpeg', '.png', '.svg'];
        
        // Начинаем с image_1_0 (основное изображение)
        for (const ext of extensions) {
            const imagePath = `/images/bim_families/${folderId}/image_1_0${ext}`;
            // Возвращаем путь, браузер сам проверит его загрузку
            return imagePath;
        }
        
        return '/images/bim_families/placeholder-family.png';
    };

    // Функция для определения следующего изображения с учетом приоритетов
    const getNextOptimalImage = (currentSrc, folderId) => {
        const match = currentSrc.match(/image_(\d+)_(\d+)\.(jpg|png|svg|jpeg)$/);
        if (!match) return null;
        
        const currentIndex = parseInt(match[1]);
        const currentExt = match[3];
        
        // Пробуем следующее изображение с тем же расширением
        const nextIndex = currentIndex + 1;
        if (nextIndex <= 20) {
            return `/images/bim_families/${folderId}/image_${nextIndex}_${nextIndex-1}.${currentExt}`;
        }
        
        // Если достигли конца, пробуем с начала с другим расширением
        const extensions = ['.jpg', '.jpeg', '.png', '.svg'];
        for (const ext of extensions) {
            if (ext !== currentExt) {
                return `/images/bim_families/${folderId}/image_1_0${ext}`;
            }
        }
        
        return null;
    };

    useEffect(() => {
        const loadImage = () => {
            const path = getBestImageForFamily();
            setImagePath(path);
            console.log('BIM Family ID:', family.id);
            console.log('Image path:', path);
        };
        
        loadImage();
    }, [family.id]);

    // Загружаем данные пользователя
    useEffect(() => {
        const loadUserData = async () => {
            const token = localStorage.getItem('access_token');
            if (token) {
                try {
                    const response = await axios.get('http://localhost:8000/api/auth/users/me/', {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        }
                    });
                    setUserData(response.data);
                } catch (error) {
                    console.error('Error loading user data:', error);
                }
            }
        };
        loadUserData();
    }, []);
    
    const handleImageError = (e) => {
        console.log('Image load failed:', e.target.src);
        setImageError(true);
        
        // Пробуем найти другое изображение в папке
        const folderId = family.id.toString().padStart(5, '0');
        const currentSrc = e.target.src;
        
        if (currentSrc.includes(`/images/bim_families/${folderId}/`)) {
            // Пробуем найти следующее оптимальное изображение
            const nextImage = getNextOptimalImage(currentSrc, folderId);
            if (nextImage) {
                e.target.src = nextImage;
                return;
            }
            
            // Если не удалось найти следующее, пробуем с начала папки
            const fallbackImage = getOptimalImage(folderId);
            if (fallbackImage !== '/images/bim_families/placeholder-family.png') {
                e.target.src = fallbackImage;
                return;
            }
            
            // Если не удалось найти альтернативу, пробуем с начала папки с другим форматом
            const currentExt = currentSrc.match(/\.(jpg|jpeg|png|svg)$/)?.[1];
            if (currentExt) {
                const extensions = ['.jpg', '.jpeg', '.png', '.svg'];
                const currentExtIndex = extensions.indexOf(`.${currentExt}`);
                const nextExtIndex = (currentExtIndex + 1) % extensions.length;
                const nextExt = extensions[nextExtIndex];
                
                const alternativeImage = `/images/bim_families/${folderId}/image_1_0${nextExt}`;
                if (alternativeImage !== currentSrc) {
                    e.target.src = alternativeImage;
                    return;
                }
            }
        } else if (currentSrc.includes('/images/bim_families/placeholder-family.png')) {
            // Если уже используем placeholder, не показываем ошибку
            setImageError(false);
            return;
        }
        
        // Если ничего не найдено, используем placeholder
        e.target.src = '/images/bim_families/placeholder-family.png';
        setImageError(false); // Сбрасываем ошибку для placeholder
    };

    const navigate = useNavigate();

    const handleCardClick = () => {
        navigate(`/bim-families/${family.id}`);
    };

    const handleDetailClick = (e) => {
        e.stopPropagation();
        navigate(`/bim-families/${family.id}`);
    };

    const handleRatingClick = async (rating, e) => {
        e.stopPropagation();
        
        // Проверяем авторизацию
        const token = localStorage.getItem('access_token');
        if (!token) {
            alert('Для оценки BIM-семейств необходимо войти в систему');
            return;
        }

        try {
            const response = await axios.post(
                `http://localhost:8000/api/bim-families/${family.id}/set_rating/`,
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
            setFamilyRating({
                average: response.data.rating,
                count: familyRating.count + 1
            });

            console.log('Rating updated successfully:', response.data);
        } catch (err) {
            console.error('Error updating rating:', err);
            if (err.response?.status === 401) {
                alert('Необходимо войти в систему для оценки BIM-семейств');
            } else {
                alert('Ошибка при обновлении рейтинга');
            }
        }
    };
    
    // Получаем категорию из модели
    const getCategory = () => {
        if (family.category?.name) {
            return family.category.name;
        }
        
        if (family.family_type && family.family_type !== 'Не указан') {
            return family.family_type;
        }
        
        return 'Категория';
    };
    
    return (
        <div className="project-card">
            <div className="project-image">
                {/* Название семейства в верхнем углу изображения */}
                <div className="project-title-overlay">
                    <span className="project-title-text">{family.name}</span>
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
                    alt={family.name}
                    onError={handleImageError}
                />
            </div>
            <div className="project-info">
                <p className="project-type">{getCategory()}</p>
                
                {/* Компактная компоновка: площадь, цена и статистика в 2 строчки */}
                <div className="project-compact-layout">
                    {/* Первая строка: площадь и цена */}
                    <div className="project-metrics">
                        <span className="project-area">
                            <i className="fas fa-cube"></i>
                            {family.area || 'N/A'} м²
                        </span>
                        <span className="project-price">
                            {formatPrice(family.cost)}
                        </span>
                    </div>
                    
                    {/* Вторая строка: статистика и рейтинг */}
                    <div className="project-bottom-row">
                        <div className="project-stats">
                            <span title="Просмотры">
                                <i className="far fa-eye"></i> {family.views_count || family.views || 0}
                            </span>
                            <span title="Загрузки">
                                <i className="fas fa-download"></i> {family.downloads_count || family.downloads || 0}
                            </span>
                            <span title="Комментарии">
                                <i className="far fa-comment"></i> {family.user_comments || family.comments || 0}
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
                {familyRating.count > 0 && (
                    <div className="rating-info-compact">
                        <span className="rating-average">Средний: {familyRating.average}/5</span>
                        <span className="rating-count">({familyRating.count})</span>
                    </div>
                )}

                {/* Кнопки действий */}
                <div className="project-actions">
                    {/* Кнопка "В заказ" */}
                    <AddToOrderButton
                        itemType="bim_family"
                        itemId={family.id}
                        itemName={family.name}
                        itemCost={family.cost || 0}
                        itemArea={family.area || 0}
                        itemCategory={getCategory()}
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

BimFamilyCard.propTypes = {
    family: PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        description: PropTypes.string,
        category: PropTypes.shape({
            name: PropTypes.string
        }),
        family_type: PropTypes.string,
        manufacturer: PropTypes.string,
        cost: PropTypes.number,
        area: PropTypes.number,
        views_count: PropTypes.number,
        views: PropTypes.number,
        downloads_count: PropTypes.number,
        downloads: PropTypes.number,
        rating_average: PropTypes.number,
        rating: PropTypes.number,
        rating_count: PropTypes.number,
        user_rating: PropTypes.number
    }).isRequired
};

export default BimFamilyCard;