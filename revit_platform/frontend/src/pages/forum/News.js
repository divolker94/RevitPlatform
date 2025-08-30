import React from 'react';
import { useNavigate } from 'react-router-dom';
import './News.css';

function News() {
    const navigate = useNavigate();

    const newsArticles = [
        {
            id: 1,
            title: 'Новые возможности Revit 2025',
            preview: 'Обзор новых функций и возможностей Revit 2025, которые помогут архитекторам и инженерам работать более эффективно.',
            image: '/images/forum/Новые возможности Revit 2025.png',
            category: 'Новости'
        },
        {
            id: 2,
            title: 'Обновление BIM стандартов',
            preview: 'Анализ последних изменений в международных стандартах BIM и их влияние на российские проекты.',
            image: '/images/forum/Новые возможности Revit 2025.png',
            category: 'Новости'
        },
        {
            id: 3,
            title: 'Конференция по BIM технологиям',
            preview: 'Анонс крупнейшей конференции по BIM технологиям в России с участием ведущих экспертов отрасли.',
            image: '/images/forum/Новые возможности Revit 2025.png',
            category: 'Новости'
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
                <h1>Новости</h1>
                <p>Актуальные новости и события в мире BIM технологий</p>
            </div>

            {/* Кнопки категорий */}
            <div className="forum-categories">
                <button 
                    className="category-button active"
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
                    className="category-button"
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

            {/* Сетка новостей */}
            <div className="forum-grid">
                {newsArticles.map(article => (
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

export default News;