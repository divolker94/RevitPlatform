import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Forum.css';

function Forum() {
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Здесь будет запрос к API для получения постов
        const samplePosts = [
            {
                id: 1,
                title: 'Новые возможности Revit 2024',
                date: '2024-03-01',
                author: 'Администратор',
                preview: 'Обзор ключевых обновлений и функций в новой версии Revit 2025...',
                image: '/images/blog/revit-2024.jpg',
                category: 'Новости'
            },
            {
                id: 2,
                title: 'Оптимизация рабочего процесса в Revit',
                date: '2024-02-28',
                author: 'Технический эксперт',
                preview: 'Лучшие практики и советы по оптимизации работы в Revit...',
                image: '/images/blog/workflow.jpg',
                category: 'Советы'
            },
            {
                id: 3,
                title: 'BIM-технологии в современной архитектуре',
                date: '2024-02-25',
                author: 'BIM-менеджер',
                preview: 'Как BIM меняет подход к проектированию зданий...',
                image: '/images/blog/bim-tech.jpg',
                category: 'Технологии'
            }
        ];

        setTimeout(() => {
            setPosts(samplePosts);
            setLoading(false);
        }, 1000);
    }, []);

    return (
        <>
            <div className="forum-background"></div>
            <div className="forum-container">
            <div className="forum-header">
                <h1>Форум RevitPlatform</h1>
                <p>Обсуждения, вопросы и ответы по работе с Revit</p>
            </div>

            <div className="forum-categories">
                <button className="category-button active" onClick={() => navigate('/forum')}>Все</button>
                <button className="category-button" onClick={() => navigate('/forum/news')}>Новости</button>
                <button className="category-button" onClick={() => navigate('/forum/tips')}>Советы</button>
                <button className="category-button" onClick={() => navigate('/forum/technology')}>Технологии</button>
                <button className="category-button" onClick={() => navigate('/forum/training')}>Обучение</button>
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
                                <button className="read-more">Перейти к обсуждению</button>
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
