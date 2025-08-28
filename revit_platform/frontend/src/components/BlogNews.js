import React from 'react';
import { Link } from 'react-router-dom';
import './BlogNews.css';

function BlogNews() {
    // Sample news data (to be replaced with actual API data)
    const newsArticles = [
        {
            id: 1,
            title: 'Новые функции Revit 2025',
            date: '2024-01-15',
            excerpt: 'Обзор ключевых обновлений и улучшений в последней версии Revit.'
        },
        {
            id: 2,
            title: 'BIM форум 2025',
            date: '2024-01-10',
            excerpt: 'Крупнейшее событие в области BIM-технологий пройдет в этом году.'
        }
    ];

    return (
        <div className="blog-news">
            <h2>Новости</h2>
            <div className="news-grid">
                {newsArticles.map(article => (
                    <div key={article.id} className="news-card">
                        <h3>{article.title}</h3>
                        <p className="news-date">{article.date}</p>
                        <p className="news-excerpt">{article.excerpt}</p>
                        <Link to={`/blog/news/${article.id}`} className="read-more">
                            Читать далее
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default BlogNews;