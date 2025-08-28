import React from 'react';
import { Link } from 'react-router-dom';
import './BlogEducation.css';

function BlogEducation() {
    const educationItems = [
        {
            id: 1,
            title: 'Основы моделирования в Revit',
            date: '2024-01-14',
            excerpt: 'Базовый курс для начинающих пользователей Revit.'
        },
        {
            id: 2,
            title: 'Продвинутые техники BIM',
            date: '2024-01-12',
            excerpt: 'Углубленное изучение BIM-технологий для опытных пользователей.'
        }
    ];

    return (
        <div className="blog-education">
            <h2>Обучение</h2>
            <div className="education-grid">
                {educationItems.map(item => (
                    <div key={item.id} className="education-card">
                        <h3>{item.title}</h3>
                        <p className="education-date">{item.date}</p>
                        <p className="education-excerpt">{item.excerpt}</p>
                        <Link to={`/blog/education/${item.id}`} className="read-more">
                            Читать далее
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default BlogEducation;