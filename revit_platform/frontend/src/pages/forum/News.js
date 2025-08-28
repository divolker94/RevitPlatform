import React from 'react';
import '../Forum.css';

function News() {
    const newsArticles = [
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
            id: 4,
            title: 'Обновление RevitPlatform',
            date: '2024-02-20',
            author: 'Администратор',
            preview: 'Важные изменения и улучшения в нашей платформе...',
            image: '/images/blog/platform-update.jpg',
            category: 'Новости'
        }
    ];

    return (
        <div className="forum-container">
            <div className="forum-header">
                <h1>Новости RevitPlatform</h1>
                <p>Последние новости и обновления</p>
            </div>

            <div className="forum-grid">
                {newsArticles.map(article => (
                    <article key={article.id} className="forum-card">
                        <div className="forum-card-image">
                            <img src={article.image} alt={article.title} />
                            <span className="forum-category">{article.category}</span>
                        </div>
                        <div className="forum-card-content">
                            <h2>{article.title}</h2>
                            <p className="forum-preview">{article.preview}</p>
                            <div className="forum-meta">
                                <span className="forum-author">
                                    <i className="fas fa-user"></i> {article.author}
                                </span>
                                <span className="forum-date">
                                    <i className="fas fa-calendar"></i> {new Date(article.date).toLocaleDateString()}
                                </span>
                            </div>
                            <button className="read-more">Перейти к обсуждению</button>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}

export default News;