import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Forum.css';

function Forum() {
    const navigate = useNavigate();
    const location = useLocation();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('all');

    useEffect(() => {
        // Определяем активную категорию на основе текущего пути
        if (location.pathname === '/forum' || location.pathname === '/blog') {
            setActiveCategory('all');
        } else if (location.pathname.includes('/news')) {
            setActiveCategory('news');
        } else if (location.pathname.includes('/tips')) {
            setActiveCategory('tips');
        } else if (location.pathname.includes('/technology')) {
            setActiveCategory('technology');
        } else if (location.pathname.includes('/training')) {
            setActiveCategory('training');
        }
    }, [location.pathname]);

    useEffect(() => {
        // Здесь будет запрос к API для получения постов
        const samplePosts = [
            {
                id: 1,
                title: 'Новые возможности Revit 2025',
                date: '2024-03-01',
                author: 'Администратор',
                preview: 'Обзор ключевых обновлений и функций в новой версии Revit 2025. Узнайте о новых инструментах моделирования, улучшенной производительности и расширенных возможностях для архитекторов и инженеров.',
                image: '/images/forum/Новые возможности Revit 2025.png',
                category: 'Новости'
            },
            {
                id: 2,
                title: 'Оптимизация рабочего процесса в Revit',
                date: '2024-02-28',
                author: 'Технический эксперт',
                preview: 'Лучшие практики и советы по оптимизации работы в Revit. Узнайте, как ускорить процесс моделирования, организовать рабочее пространство и повысить эффективность проектирования.',
                image: '/images/forum/Оптимизация рабочего процесса в Revit.png',
                category: 'Советы'
            },
            {
                id: 3,
                title: 'BIM-технологии в современной архитектуре',
                date: '2024-02-25',
                author: 'BIM-менеджер',
                preview: 'Как BIM меняет подход к проектированию зданий. Инновационные решения, интеграция с другими технологиями и будущее архитектурного проектирования.',
                image: '/images/forum/BIM-технологии в современной архитектуре.png',
                category: 'Технологии'
            }
        ];

        setTimeout(() => {
            setPosts(samplePosts);
            setLoading(false);
        }, 1000);
    }, []);

    const handleCategoryClick = (category, path) => {
        setActiveCategory(category);
        navigate(path);
    };

    return (
        <>
            <div className="forum-background"></div>
            <div className="forum-container">
            <div className="forum-header">
                <h1>Форум RevitPlatform</h1>
                <p>Основные разделы: Новости, Советы и Технологии</p>
            </div>

            <div className="forum-categories">
                <button 
                    className={`category-button ${activeCategory === 'all' ? 'active' : ''}`} 
                    onClick={() => handleCategoryClick('all', '/forum')}
                >
                    Все
                </button>
                <button 
                    className={`category-button ${activeCategory === 'news' ? 'active' : ''}`} 
                    onClick={() => handleCategoryClick('news', '/forum/news')}
                >
                    Новости
                </button>
                <button 
                    className={`category-button ${activeCategory === 'tips' ? 'active' : ''}`} 
                    onClick={() => handleCategoryClick('tips', '/forum/tips')}
                >
                    Советы
                </button>
                <button 
                    className={`category-button ${activeCategory === 'technology' ? 'active' : ''}`} 
                    onClick={() => handleCategoryClick('technology', '/forum/technology')}
                >
                    Технологии
                </button>
                <button 
                    className={`category-button ${activeCategory === 'training' ? 'active' : ''}`} 
                    onClick={() => handleCategoryClick('training', '/forum/training')}
                >
                    Обучение
                </button>
            </div>

            {loading ? (
                <div className="loading-spinner">
                    <i className="fas fa-spinner fa-spin"></i>
                    <span>Загрузка тем...</span>
                </div>
            ) : (
                <div className="forum-grid">
                    {posts.map(post => (
                        <article key={post.id} className="forum-card">
                            <div className="forum-card-image">
                                <img src={post.image} alt={post.title} />
                                <span className="forum-category">{post.category}</span>
                            </div>
                            <div className="forum-card-content">
                                <h2>{post.title}</h2>
                                <p className="forum-preview">{post.preview}</p>
                                <div className="forum-meta">
                                    <span className="forum-author">
                                        <i className="fas fa-user"></i> {post.author}
                                    </span>
                                    <span className="forum-date">
                                        <i className="fas fa-calendar"></i> {new Date(post.date).toLocaleDateString()}
                                    </span>
                                </div>
                                <button 
                                    className="read-more"
                                    onClick={() => navigate(`/forum/post/${post.id}`)}
                                >
                                    Перейти к обсуждению
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
        </>
    );
}

export default Forum;
