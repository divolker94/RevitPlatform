import React from 'react';
import { useNavigate } from 'react-router-dom';
import './News.css';

function Tips() {
    const navigate = useNavigate();

    const tipsArticles = [
        {
            id: 1,
            title: 'Оптимизация рабочего процесса в Revit',
            preview: 'Практические советы по оптимизации рабочего процесса в Revit для повышения производительности.',
            image: '/images/forum/Оптимизация рабочего процесса в Revit.png',
            category: 'Советы'
        },
        {
            id: 2,
            title: 'Лучшие практики организации семейств',
            preview: 'Практические рекомендации по созданию и организации семейств в Revit.',
            image: '/images/forum/Оптимизация рабочего процесса в Revit.png',
            category: 'Советы'
        },
        {
            id: 3,
            title: 'Совместная работа над проектом',
            preview: 'Руководство по организации совместной работы над проектом в Revit.',
            image: '/images/forum/Оптимизация рабочего процесса в Revit.png',
            category: 'Советы'
        },
        {
            id: 4,
            title: 'Настройка шаблонов проекта',
            preview: 'Как правильно настроить шаблоны для эффективной работы.',
            image: '/images/forum/Оптимизация рабочего процесса в Revit.png',
            category: 'Советы'
        },
        {
            id: 5,
            title: 'Работа с параметрами семейств',
            preview: 'Основы создания параметрических семейств в Revit.',
            image: '/images/forum/Оптимизация рабочего процесса в Revit.png',
            category: 'Советы'
        },
        {
            id: 6,
            title: 'Оптимизация производительности',
            preview: 'Способы улучшения производительности при работе с большими проектами.',
            image: '/images/forum/Оптимизация рабочего процесса в Revit.png',
            category: 'Советы'
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
                <h1>Советы</h1>
                <p>Практические советы и рекомендации для работы с Revit</p>
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
                    className="category-button active"
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

            {/* Сетка советов */}
            <div className="forum-grid">
                {tipsArticles.map(article => (
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

export default Tips;