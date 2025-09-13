import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AddToOrderButton from '../components/AddToOrderButton';
import './BimFamilyDetail.css';

function BimFamilyDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [family, setFamily] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [imageError, setImageError] = useState(false);
    const [imagePath, setImagePath] = useState('');
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [availableImages, setAvailableImages] = useState([]);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [commentLoading, setCommentLoading] = useState(false);

    useEffect(() => {
        fetchFamily();
    }, [id]);

    useEffect(() => {
        if (family) {
            const folderId = family.id.toString().padStart(5, '0');
            const images = findAllAvailableImages(folderId);
            setAvailableImages(images);
            
            if (images.length > 0) {
                setImagePath(images[0].path);
                setSelectedImageIndex(0);
            }
        }
    }, [family]);

    const fetchFamily = async () => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:8000/api/bim-families/${id}/`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setFamily(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching family:', error);
            setError(`Ошибка при загрузке семейства: ${error.message}`);
            setLoading(false);
        }
    };

    const formatTechnicalSpecs = (specs) => {
        if (!specs || typeof specs === 'string') return {};
        
        try {
            return typeof specs === 'string' ? JSON.parse(specs) : specs;
        } catch {
            return {};
        }
    };

    const formatCatalogItems = (items) => {
        if (!items || !Array.isArray(items)) return [];
        return items;
    };
    
    const formatBasicSpecs = (specs) => {
        if (!specs || typeof specs === 'string') return {};
        
        try {
            return typeof specs === 'string' ? JSON.parse(specs) : specs;
        } catch {
            return {};
        }
    };
    
    // Функция для поиска всех доступных изображений в папке семейства
    const findAllAvailableImages = async (folderId) => {
        const maxImages = 20;
        const extensions = ['.jpg', '.jpeg', '.png', '.svg'];
        const realImages = [];
        
        // Проверяем каждое изображение на существование
        for (let i = 1; i <= maxImages; i++) {
            for (const ext of extensions) {
                const imagePath = `/images/bim_families/${folderId}/image_${i}_${i-1}${ext}`;
                
                try {
                    // Проверяем существование изображения через HEAD запрос
                    const response = await fetch(imagePath, { method: 'HEAD' });
                    if (response.ok) {
                        realImages.push({
                            path: imagePath,
                            index: i,
                            extension: ext
                        });
                        // Если нашли изображение с этим номером, переходим к следующему
                        break;
                    }
                } catch (error) {
                    // Игнорируем ошибки и продолжаем поиск
                    continue;
                }
            }
        }
        
        return realImages;
    };

    const fetchComments = async () => {
        try {
            const response = await fetch(`http://localhost:8000/api/bim-families/${id}/comments/`);
            if (response.ok) {
                const data = await response.json();
                setComments(data);
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    };

    const addComment = async () => {
        if (!newComment.trim()) return;
        
        setCommentLoading(true);
        try {
            const response = await fetch(`http://localhost:8000/api/bim-families/${id}/comments/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify({
                    content: newComment.trim()
                })
            });
            
            if (response.ok) {
                const comment = await response.json();
                setComments([comment, ...comments]);
                setNewComment('');
                
                // Обновляем количество комментариев в семействе
                setFamily(prev => ({
                    ...prev,
                    comments: (prev.comments || 0) + 1
                }));
            }
        } catch (error) {
            console.error('Error adding comment:', error);
        } finally {
            setCommentLoading(false);
        }
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
        
        // Всегда используем локальные изображения из папки
        // Начинаем с оптимального изображения (image_1_0)
        return findAvailableImage(folderId, 1);
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

    // Функция для переключения на следующее изображение
    const nextImage = () => {
        if (availableImages.length > 0) {
            const nextIndex = (selectedImageIndex + 1) % availableImages.length;
            setSelectedImageIndex(nextIndex);
            setImagePath(availableImages[nextIndex].path);
            setImageError(false);
        }
    };

    // Функция для переключения на предыдущее изображение
    const prevImage = () => {
        if (availableImages.length > 0) {
            const prevIndex = selectedImageIndex === 0 ? availableImages.length - 1 : selectedImageIndex - 1;
            setSelectedImageIndex(prevIndex);
            setImagePath(availableImages[prevIndex].path);
            setImageError(false);
        }
    };

    // Функция для выбора конкретного изображения по индексу
    const selectImage = (index) => {
        if (availableImages[index]) {
            setSelectedImageIndex(index);
            setImagePath(availableImages[index].path);
            setImageError(false);
        }
    };

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
            const fallbackImage = findAvailableImage(folderId, 1);
            if (fallbackImage !== '/images/bim_families/placeholder-family.png') {
                e.target.src = fallbackImage;
                return;
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

    // Функция для получения правильного пути к изображению
    const getImagePath = (imagePath) => {
        if (!imagePath) return '/images/placeholder-family.png';
        
        // Если путь уже содержит полный URL
        if (imagePath.startsWith('http')) {
            return imagePath;
        }
        
        // Теперь путь уже содержит правильную структуру: images/bim_families/00001/filename.jpg
        // Просто добавляем слеш в начало
        return `/${imagePath}`;
    };

    if (loading) {
        return (
            <div className="family-detail-loading">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Загрузка...</span>
                </div>
                <p className="mt-3">Загружаем информацию о семействе...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="family-detail-error">
                <div className="alert alert-danger" role="alert">
                    <h4>Ошибка загрузки</h4>
                    <p>{error}</p>
                    <button className="btn btn-outline-danger" onClick={() => navigate('/families')}>
                        Вернуться к списку
                    </button>
                </div>
            </div>
        );
    }

    if (!family) {
        return (
            <div className="family-detail-not-found">
                <h3>Семейство не найдено</h3>
                <button className="btn btn-primary" onClick={() => navigate('/families')}>
                    Вернуться к списку
                </button>
            </div>
        );
    }

    const technicalSpecs = formatTechnicalSpecs(family.technical_specs);
    const basicSpecs = formatBasicSpecs(family.basic_specs);
    const catalogItems = formatCatalogItems(family.catalog_items);

    return (
        <div className="family-detail-page">
            <div className="container-fluid">
                {/* Хлебные крошки */}
                <nav aria-label="breadcrumb" className="mt-3">
                    <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                            <a href="/families">Семейства</a>
                        </li>
                        <li className="breadcrumb-item active" aria-current="page">
                            {family.name}
                        </li>
                    </ol>
                </nav>

                <div className="row">
                    {/* Галерея изображений - первая колонка */}
                    <div className="col-lg-4">
                        <div className="family-gallery">
                            <div className="main-image-container">
                                {imageError ? (
                                    <div className="image-error">
                                        Ошибка загрузки изображения
                                        <br />
                                        <small>{imagePath}</small>
                                    </div>
                                ) : (
                                    <img 
                                        src={imagePath || '/images/bim_families/placeholder-family.png'}
                                        alt={family.name}
                                        className="main-image"
                                        onError={handleImageError}
                                    />
                                )}
                                
                                {/* Кнопки навигации по изображениям */}
                                {availableImages.length > 1 && (
                                    <div className="image-navigation">
                                        <button 
                                            className="nav-btn prev-btn" 
                                            onClick={prevImage}
                                            title="Предыдущее изображение"
                                        >
                                            <i className="fas fa-chevron-left"></i>
                                        </button>
                                        <button 
                                            className="nav-btn next-btn" 
                                            onClick={nextImage}
                                            title="Следующее изображение"
                                        >
                                            <i className="fas fa-chevron-right"></i>
                                        </button>
                                    </div>
                                )}
                                
                                {/* Счетчик изображений */}
                                {availableImages.length > 1 && (
                                    <div className="image-counter">
                                        {selectedImageIndex + 1} / {availableImages.length}
                                    </div>
                                )}
                            </div>
                            
                            {/* Галерея миниатюр */}
                            {availableImages.length > 1 && (
                                <div className="thumbnail-gallery">
                                    <h6 className="gallery-title">Все изображения ({availableImages.length})</h6>
                                    <div className="thumbnails-container">
                                        {availableImages.map((image, index) => (
                                            <div 
                                                key={index}
                                                className={`thumbnail ${index === selectedImageIndex ? 'active' : ''}`}
                                                onClick={() => selectImage(index)}
                                                title={`Изображение ${index + 1}`}
                                            >
                                                <img 
                                                    src={image.path}
                                                    alt={`${family.name} - изображение ${index + 1}`}
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                                <div className="thumbnail-number">{index + 1}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            

                        </div>
                    </div>

                    {/* Основная информация о семействе - вторая колонка */}
                    <div className="col-lg-4">
                        <div className="family-info">
                            <h1 className="family-title">{family.name}</h1>
                            
                            <div className="family-description">
                                <h5>Описание</h5>
                                <p>{family.description}</p>
                            </div>
                            
                            <div className="family-meta">
                                {family.total_images > 0 && (
                                    <span className="meta-item">
                                        <i className="fas fa-images"></i>
                                        Изображений: {family.total_images}
                                    </span>
                                )}
                                <span className="meta-item">
                                    <i className="fas fa-download"></i>
                                    Скачивания: {family.downloads || 0}
                                </span>
                            </div>

                            {/* Кнопки действий */}
                            <div className="family-actions">
                                <button className="btn btn-primary btn-lg w-100 mb-2">
                                    <i className="fas fa-download"></i> Скачать семейство
                                </button>
                                <button className="btn btn-outline-secondary w-100 mb-2">
                                    <i className="fas fa-share"></i> Поделиться
                                </button>
                                <AddToOrderButton
                                    itemType="bim_family"
                                    itemId={family.id}
                                    itemName={family.name}
                                    itemCost={family.cost || 0}
                                    itemArea={family.area || 0}
                                    itemCategory={family.category?.name || family.family_type}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Дополнительная информация - третья колонка */}
                    <div className="col-lg-4">
                        <div className="family-details">
                            {/* Технические характеристики */}
                            {(Object.keys(technicalSpecs).length > 0 || Object.keys(basicSpecs).length > 0) && (
                                <div className="technical-specs">
                                    <h5>Технические характеристики</h5>
                                    <div className="specs-list">
                                        {/* Сначала показываем базовые характеристики (включая материал) */}
                                        {Object.entries(basicSpecs).map(([key, value]) => (
                                            <div key={`basic-${key}`} className="spec-item">
                                                <span className="spec-key">{key}:</span>
                                                <span className="spec-value">{value}</span>
                                            </div>
                                        ))}
                                        {/* Затем показываем технические характеристики */}
                                        {Object.entries(technicalSpecs).map(([key, value]) => (
                                            <div key={`tech-${key}`} className="spec-item">
                                                <span className="spec-key">{key}:</span>
                                                <span className="spec-value">{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Каталог элементов */}
                            {catalogItems.length > 0 && (
                                <div className="catalog-items">
                                    <h5>Категории</h5>
                                    <div className="catalog-tags">
                                        {catalogItems.map((item, index) => (
                                            <span key={index} className="catalog-tag">{item}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Документация */}
                            {family.download_info && family.download_info.documentation && (
                                <div className="documentation-info">
                                    <h5>Документация</h5>
                                    <div className="documentation-details">
                                        <p>{family.download_info.documentation}</p>
                                    </div>
                                </div>
                            )}

                            {/* Компания */}
                            {family.company_info && (
                                <div className="company-info">
                                    <h5>Производитель</h5>
                                    <div className="company-details">
                                        {family.company_info.name && (
                                            <p><strong>Название:</strong> {family.company_info.name}</p>
                                        )}
                                        {family.company_info.phone && (
                                            <p><strong>Телефон:</strong> {family.company_info.phone}</p>
                                        )}
                                        {family.company_info.email && (
                                            <p><strong>Email:</strong> {family.company_info.email}</p>
                                        )}
                                        {family.url && (
                                            <p>
                                                <strong>Сайт:</strong> 
                                                <a href={family.url} target="_blank" rel="noopener noreferrer" className="company-website">
                                                    {family.url.replace(/^https?:\/\//, '')}
                                                </a>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default BimFamilyDetail;
