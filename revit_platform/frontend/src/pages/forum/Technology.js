import React from 'react';
import '../Forum.css';

function Technology() {
    const techArticles = [
        {
            id: 3,
            title: 'BIM-технологии в современной архитектуре',
            date: '2024-02-25',
            author: 'BIM-менеджер',
            preview: 'Как BIM меняет подход к проектированию зданий...',
            image: '/images/blog/bim-tech.jpg',
            category: 'Технологии'
        },
        {
            id: 6,
            title: 'Интеграция Revit с другими BIM-инструментами',
            date: '2024-02-10',
            author: 'Системный архитектор',
            preview: 'Обзор возможностей интеграции Revit с другими инструментами BIM...',
            image: '/images/blog/integration.jpg',
            category: 'Технологии'
        }
    ];

    return (
        <div className="forum-container">
            <div className="forum-header">
                <h1>Технологии в Revit</h1>
                <p>Инновации и технологические решения</p>
            </div>

            <div className="forum-grid">
                {techArticles.map(article => (
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

export default Technology;