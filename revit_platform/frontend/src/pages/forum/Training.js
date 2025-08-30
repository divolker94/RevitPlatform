import React from 'react';
import { useNavigate } from 'react-router-dom';
import './News.css';

function Training() {
    const navigate = useNavigate();

    const trainingArticles = [
        {
            id: 1,
            title: 'Основы работы с Revit для начинающих',
            preview: 'Базовый курс для тех, кто только начинает работать с Revit. Пошаговое изучение интерфейса, основных инструментов и принципов моделирования.',
            image: '/images/forum/Основы работы с Revit для начинающих.png',
            category: 'Обучение'
        },
        {
            id: 2,
            title: 'Продвинутые техники моделирования в Revit',
            preview: 'Изучение продвинутых техник моделирования для опытных пользователей Revit.',
            image: '/images/forum/Основы работы с Revit для начинающих.png',
            category: 'Обучение'
        },
        {
            id: 3,
            title: 'Курс по семействам Revit',
            preview: 'Подробный курс по созданию и настройке семейств в Revit для повышения эффективности работы.',
            image: '/images/forum/Основы работы с Revit для начинающих.png',
            category: 'Обучение'
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
                <h1>Обучение</h1>
                <p>Курсы и обучающие материалы по работе с Revit</p>
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
                    className="category-button"
                    onClick={() => handleCategoryClick('Технологии')}
                >
                    Технологии
                </button>
                <button 
                    className="category-button active"
                    onClick={() => handleCategoryClick('Обучение')}
                >
                    Обучение
                </button>
            </div>

            {/* Сетка обучения */}
            <div className="forum-grid">
                {trainingArticles.map(article => (
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

export default Training;