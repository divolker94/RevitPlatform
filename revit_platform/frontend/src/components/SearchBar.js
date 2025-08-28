import React, { useState } from 'react';
import './SearchBar.css';

function SearchBar({ onSearch }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [category, setCategory] = useState('all');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            onSearch(searchQuery, category);
        }
    };

    return (
        <div className="search-bar">
            <form onSubmit={handleSubmit}>
                <div className="search-input-group">
                    <select 
                        className="search-category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        <option value="all">Все</option>
                        <option value="architectural-projects">Архитектурные проекты</option>
                        <option value="families">Семейства</option>
                        <option value="projects">Проекты</option>
                        <option value="blog">Блог</option>
                    </select>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Поиск по сайту..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button className="search-button" type="submit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                    </button>
                </div>
            </form>
        </div>
    );
}

export default SearchBar;
