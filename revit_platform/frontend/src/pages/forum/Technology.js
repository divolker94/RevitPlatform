import React from 'react';
import { useNavigate } from 'react-router-dom';
import './News.css';

function Technology() {
    const navigate = useNavigate();

    const techArticles = [
        {
            id: 1,
            title: 'BIM-технологии в современной архитектуре',
            preview: 'Анализ влияния BIM-технологий на современную архитектуру.',
            image: '/images/forum/BIM-технологии в современной архитектуре.png',
            category: 'Технологии'
        },
        {
            id: 2,
            title: 'Интеграция Revit с другими BIM-инструментами',
            preview: 'Обзор возможностей интеграции Revit с другими BIM-инструментами.',
            image: '/images/forum/BIM-технологии в современной архитектуре.png',
            category: 'Технологии'
        },
        {
            id: 3,
            title: 'Автоматизация процессов в Revit с помощью Dynamo',
            preview: 'Введение в автоматизацию процессов в Revit с помощью Dynamo.',
            image: '/images/forum/BIM-технологии в современной архитектуре.png',
            category: 'Технологии'
        },
        {
            id: 4,
            title: 'Облачные BIM-решения',
            preview: 'Современные облачные решения для BIM-моделирования.',
            image: '/images/forum/BIM-технологии в современной архитектуре.png',
            category: 'Технологии'
        },
        {
            id: 5,
            title: 'VR и AR в архитектурном проектировании',
            preview: 'Применение виртуальной и дополненной реальности в архитектуре.',
            image: '/images/forum/BIM-технологии в современной архитектуре.png',
            category: 'Технологии'
        },
        {
            id: 6,
            title: 'Искусственный интеллект в BIM',
            preview: 'Перспективы использования ИИ в BIM-моделировании.',
            image: '/images/forum/BIM-технологии в современной архитектуре.png',
            category: 'Технологии'
        }
    ];

    const handleCategoryClick = (category) => {
        switch(category) {
            case 'Новости':
                navigate('/forum/news');
                break;
            case 'Советы':
                navigate('/forum/tips');
                break;
            case 'Технологии':
                navigate('/forum/technology');
                break;
            case 'Обучение':
                navigate('/forum/training');
                break;
            default:
                navigate('/forum');
        }
    };

    return (
        <div className="forum-page">
            <div className="forum-background"></div>
            <div className="forum-background-overlay"></div>

            {/* Заголовок страницы */}
            <div className="forum-page-header">
                <h1>Технологии</h1>
                <p>Современные технологии и инновации в BIM-моделировании</p>
            </div>

            {/* Кнопки категорий */}
            <div className="forum-categories">
                <button 
                    className="category-button"
                    onClick={() => handleCategoryClick('Новости')}
                >
                    Новости
                </button>
                <button 
                    className="category-button"
                    onClick={() => handleCategoryClick('Советы')}
                >
                    Советы
                </button>
                <button 
                    className="category-button active"
                    onClick={() => handleCategoryClick('Технологии')}
                >
                    Технологии
                </button>
                <button 
                    className="category-button"
                    onClick={() => handleCategoryClick('Обучение')}
                >
                    Обучение
                </button>
            </div>

            {/* Сетка технологий */}
            <div className="forum-grid">
                {techArticles.map(article => (
                    <div key={article.id} className="forum-card">
                        <div className="forum-card-image">
                            <img src={article.image} alt={article.title} />
                        </div>
                        <div className="forum-card-content">
                            <span className="forum-category">{article.category}</span>
                            <h2>{article.title}</h2>
                            <div className="forum-preview">
                                <p>{article.preview}</p>
                            </div>
                            <div className="read-more">
                                <button 
                                    className="read-more-button"
                                    onClick={() => navigate(`/forum/post/${article.id}`)}
                                >
                                    Перейти к обсуждению
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Technology;