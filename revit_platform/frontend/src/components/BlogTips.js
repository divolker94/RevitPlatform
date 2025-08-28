import React from 'react';
import { Link } from 'react-router-dom';
import './BlogTips.css';

function BlogTips() {
    const tips = [
        {
            id: 1,
            title: 'Оптимизация рабочего процесса в Revit',
            date: '2024-01-14',
            excerpt: 'Полезные советы по улучшению производительности при работе с Revit.'
        },
        {
            id: 2,
            title: 'Эффективное использование семейств',
            date: '2024-01-12',
            excerpt: 'Как правильно организовать и использовать семейства в ваших проектах.'
        }
    ];

    return (
        <div className="blog-tips">
            <h2>Советы</h2>
            <div className="tips-grid">
                {tips.map(tip => (
                    <div key={tip.id} className="tip-card">
                        <h3>{tip.title}</h3>
                        <p className="tip-date">{tip.date}</p>
                        <p className="tip-excerpt">{tip.excerpt}</p>
                        <Link to={`/blog/tips/${tip.id}`} className="read-more">
                            Читать далее
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default BlogTips;