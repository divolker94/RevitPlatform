import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './ArchitecturalProjectsCarousel.css';

function ArchitecturalProjectsCarousel() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/architectural-projects/');
                if (response.ok) {
                    const data = await response.json();
                    // Берем первые 6 проектов для карусели
                    setProjects(data.results ? data.results.slice(0, 6) : data.slice(0, 6));
                }
            } catch (error) {
                console.error('Error fetching architectural projects:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    useEffect(() => {
        if (projects.length > 0) {
            const interval = setInterval(() => {
                setCurrentIndex((prevIndex) => 
                    prevIndex === projects.length - 1 ? 0 : prevIndex + 1
                );
            }, 4000); // Смена каждые 4 секунды

            return () => clearInterval(interval);
        }
    }, [projects.length]);

    const goToSlide = (index) => {
        setCurrentIndex(index);
    };

    const goToPrevious = () => {
        setCurrentIndex((prevIndex) => 
            prevIndex === 0 ? projects.length - 1 : prevIndex - 1
        );
    };

    const goToNext = () => {
        setCurrentIndex((prevIndex) => 
            prevIndex === projects.length - 1 ? 0 : prevIndex + 1
        );
    };

    if (loading) {
        return (
            <div className="carousel-loading">
                <div className="loading-spinner"></div>
                <p>Загрузка проектов...</p>
            </div>
        );
    }

    if (projects.length === 0) {
        return null;
    }

    return (
        <div className="architectural-carousel-section">
            <div className="container">
                <div className="carousel-header">
                    <h2>Архитектурные проекты</h2>
                    <p>Ознакомьтесь с нашими лучшими проектами</p>
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
                            {projects.map((project, index) => (
                                <div key={project.id} className="carousel-item">
                                    <Link to={`/architectural-projects/${project.id}`} className="project-link">
                                        <div className="project-image">
                                            <img 
                                                src={project.image_main ? `/images/catalog/${project.image_main}` : '/images/catalog/default-project.jpg'} 
                                                alt={project.name}
                                                onError={(e) => {
                                                    e.target.src = '/images/catalog/default-project.jpg';
                                                }}
                                            />
                                        </div>
                                        <div className="project-info">
                                            <h3>{project.name}</h3>
                                            <p className="project-category">{project.functional_class || 'Архитектурный проект'}</p>
                                            <p className="project-area">{project.total_area ? `${project.total_area} м²` : 'Площадь не указана'}</p>
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
                    {projects.map((_, index) => (
                        <button
                            key={index}
                            className={`indicator ${index === currentIndex ? 'active' : ''}`}
                            onClick={() => goToSlide(index)}
                        />
                    ))}
                </div>
                
                <div className="carousel-footer">
                    <Link to="/architectural-projects" className="view-all-button">
                        Посмотреть все проекты
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default ArchitecturalProjectsCarousel;

