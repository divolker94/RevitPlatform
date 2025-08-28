import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './BimFamilyDetail.css';

function BimFamilyDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [family, setFamily] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedImage, setSelectedImage] = useState(0);

    useEffect(() => {
        fetchFamily();
    }, [id]);

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
                    {/* Галерея изображений - увеличиваем размер */}
                    <div className="col-lg-9">
                        <div className="family-gallery">
                            {family.images && family.images.length > 0 ? (
                                <>
                                    <div className="main-image-container">
                                        <img 
                                            src={getImagePath(family.images[selectedImage].local_path)}
                                            alt={family.name}
                                            className="main-image"
                                        />
                                    </div>
                                    
                                    {family.images.length > 1 && (
                                        <div className="thumbnail-gallery-vertical">
                                            <h5 className="gallery-title">Все изображения ({family.images.length})</h5>
                                            <div className="thumbnails-container">
                                                {family.images.map((image, index) => (
                                                    <div 
                                                        key={index}
                                                        className={`thumbnail-vertical ${index === selectedImage ? 'active' : ''}`}
                                                        onClick={() => setSelectedImage(index)}
                                                    >
                                                        <img 
                                                            src={getImagePath(image.local_path)}
                                                            alt={`${family.name} - изображение ${index + 1}`}
                                                        />
                                                        <div className="thumbnail-number">{index + 1}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="no-images">
                                    <i className="fas fa-image fa-3x text-muted"></i>
                                    <p>Изображения не найдены</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Информация о семействе - увеличиваем размер */}
                    <div className="col-lg-3">
                        <div className="family-info">
                            <h1 className="family-title">{family.name}</h1>
                            
                            <div className="family-meta">
                                <span className="meta-item">
                                    <i className="fas fa-calendar"></i>
                                    Парсинг: {family.parsed_at}
                                </span>
                                {family.total_images > 0 && (
                                    <span className="meta-item">
                                        <i className="fas fa-images"></i>
                                        Изображений: {family.total_images}
                                    </span>
                                )}
                                <span className="meta-item">
                                    <i className="fas fa-eye"></i>
                                    Просмотры: {family.views || 0}
                                </span>
                                <span className="meta-item">
                                    <i className="fas fa-download"></i>
                                    Скачивания: {family.downloads || 0}
                                </span>
                                <span className="meta-item">
                                    <i className="fas fa-comment"></i>
                                    Комментарии: {family.comments || 0}
                                </span>
                            </div>

                            {/* Рейтинг */}
                            <div className="family-rating">
                                <h5>Рейтинг</h5>
                                <div className="rating-display">
                                    <div className="rating-stars">
                                        {[...Array(5)].map((_, i) => (
                                            <i 
                                                key={i} 
                                                className={`fas fa-star ${i < Math.floor(family.rating || 0) ? 'filled' : ''}`}
                                            ></i>
                                        ))}
                                    </div>
                                    <span className="rating-value">{family.rating || 0}/5</span>
                                </div>
                            </div>

                            <div className="family-description">
                                <h5>Описание</h5>
                                <p>{family.description}</p>
                            </div>

                            {/* Технические характеристики */}
                            {Object.keys(technicalSpecs).length > 0 && (
                                <div className="technical-specs">
                                    <h5>Технические характеристики</h5>
                                    <div className="specs-list">
                                        {Object.entries(technicalSpecs).map(([key, value]) => (
                                            <div key={key} className="spec-item">
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
                                    </div>
                                </div>
                            )}

                            {/* Кнопки действий */}
                            <div className="family-actions">
                                <button className="btn btn-primary btn-lg w-100 mb-2">
                                    <i className="fas fa-download"></i> Скачать семейство
                                </button>
                                <button className="btn btn-outline-secondary w-100">
                                    <i className="fas fa-share"></i> Поделиться
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default BimFamilyDetail;
