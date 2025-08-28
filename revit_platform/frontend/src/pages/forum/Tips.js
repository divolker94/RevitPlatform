import React from 'react';
import '../Forum.css';

function Tips() {
    const tipsArticles = [
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
            id: 5,
            title: 'Эффективное использование семейств',
            date: '2024-02-15',
            author: 'BIM-специалист',
            preview: 'Практические советы по работе с семействами в Revit...',
            image: '/images/blog/families.jpg',
            category: 'Советы'
        }
    ];

    return (
        <div className="forum-container">
            <div className="forum-header">
                <h1>Советы по работе с Revit</h1>
                <p>Практические рекомендации и лучшие практики</p>
            </div>

            <div className="forum-grid">
                {tipsArticles.map(article => (
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

export default Tips;