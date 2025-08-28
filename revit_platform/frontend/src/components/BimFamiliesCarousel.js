import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './BimFamiliesCarousel.css';

function BimFamiliesCarousel() {
    const [families, setFamilies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const fetchFamilies = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/bim-families/');
                if (response.ok) {
                    const data = await response.json();
                    // Берем первые 6 семейств для карусели
                    setFamilies(data.results ? data.results.slice(0, 6) : data.slice(0, 6));
                }
            } catch (error) {
                console.error('Error fetching BIM families:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFamilies();
    }, []);

    useEffect(() => {
        if (families.length > 0) {
            const interval = setInterval(() => {
                setCurrentIndex((prevIndex) => 
                    prevIndex === families.length - 1 ? 0 : prevIndex + 1
                );
            }, 4000); // Смена каждые 4 секунды

            return () => clearInterval(interval);
        }
    }, [families.length]);

    const goToSlide = (index) => {
        setCurrentIndex(index);
    };

    const goToPrevious = () => {
        setCurrentIndex((prevIndex) => 
            prevIndex === 0 ? families.length - 1 : prevIndex - 1
        );
    };

    const goToNext = () => {
        setCurrentIndex((prevIndex) => 
            prevIndex === families.length - 1 ? 0 : prevIndex + 1
        );
    };

    // Функция для получения правильного пути к изображению
    const getImagePath = (family) => {
        if (!family.images || family.images.length === 0) {
            return '/images/placeholder-family.png';
        }
        
        const firstImage = family.images[0];
        if (!firstImage.local_path) {
            return '/images/placeholder-family.png';
        }
        
        // Теперь путь уже содержит правильную структуру: images/bim_families/00001/filename.jpg
        // Просто добавляем слеш в начало
        return `/${firstImage.local_path}`;
    };

    if (loading) {
        return (
            <div className="carousel-loading">
                <div className="loading-spinner"></div>
                <p>Загрузка семейств...</p>
            </div>
        );
    }

    if (families.length === 0) {
        return null;
    }

    return (
        <div className="bim-families-carousel-section">
            <div className="container">
                <div className="carousel-header">
                    <h2>BIM Семейства</h2>
                    <p>Ознакомьтесь с нашей библиотекой BIM семейств</p>
                </div>
                
                <div className="carousel-container">
                    <button className="carousel-button prev" onClick={goToPrevious}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15,18 9,12 15,6"></polyline>
                        </svg>
                    </button>
                    
                    <div className="carousel-track">
                        <div 
                            className="carousel-slide active"
                            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                        >
                            {families.map((family, index) => (
                                <div key={family.id} className="carousel-item">
                                    <Link to={`/families/${family.id}`} className="family-link">
                                        <div className="family-image">
                                            <img 
                                                src={getImagePath(family)} 
                                                alt={family.name}
                                                onError={(e) => {
                                                    e.target.src = '/images/placeholder-family.png';
                                                }}
                                            />
                                        </div>
                                        <div className="family-info">
                                            <h3>{family.name}</h3>
                                            <p className="family-category">
                                                {family.technical_specs?.Категория || 'Категория не указана'}
                                            </p>
                                            <p className="family-images">
                                                {family.total_images || 0} изображений
                                            </p>
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <button className="carousel-button next" onClick={goToNext}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9,18 15,12 9,6"></polyline>
                        </svg>
                    </button>
                </div>
                
                <div className="carousel-indicators">
                    {families.map((_, index) => (
                        <button
                            key={index}
                            className={`indicator ${index === currentIndex ? 'active' : ''}`}
                            onClick={() => goToSlide(index)}
                        />
                    ))}
                </div>
                
                <div className="carousel-footer">
                    <Link to="/families" className="view-all-button">
                        Посмотреть все семейства
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default BimFamiliesCarousel;
