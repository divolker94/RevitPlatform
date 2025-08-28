import React from 'react';
import { Link } from 'react-router-dom';
import './BlogTechnology.css';

function BlogTechnology() {
    const technologies = [
        {
            id: 1,
            title: 'Искусственный интеллект в BIM',
            date: '2024-01-13',
            excerpt: 'Как AI-технологии меняют подход к проектированию в Revit.'
        },
        {
            id: 2,
            title: 'Облачные технологии в Revit',
            date: '2024-01-11',
            excerpt: 'Преимущества использования облачных решений для совместной работы.'
        }
    ];

    return (
        <div className="blog-technology">
            <h2>Технологии</h2>
            <div className="technology-grid">
                {technologies.map(tech => (
                    <div key={tech.id} className="technology-card">
                        <h3>{tech.title}</h3>
                        <p className="technology-date">{tech.date}</p>
                        <p className="technology-excerpt">{tech.excerpt}</p>
                        <Link to={`/blog/technology/${tech.id}`} className="read-more">
                            Читать далее
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default BlogTechnology;