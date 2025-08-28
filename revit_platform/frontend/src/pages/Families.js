import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BimFamilyCard from '../components/BimFamilyCard';
import './Families.css';

function Families() {
    const [families, setFamilies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [categories, setCategories] = useState([]);
    const [filters, setFilters] = useState({
        object_type: '',
        area: '',
        price: ''
    });
    const [sortBy, setSortBy] = useState('name');
    const navigate = useNavigate();

    useEffect(() => {
        fetchFamilies();
    }, []);

    const fetchFamilies = async () => {
        try {
            setLoading(true);
            
            // Получаем данные из PostgreSQL через Django API
            const response = await fetch('http://localhost:8000/api/bim-families/', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setFamilies(Array.isArray(data) ? data : []);
            
            // Извлекаем уникальные категории из технических характеристик
            const uniqueCategories = extractCategories(data);
            setCategories(uniqueCategories);
            
            setLoading(false);
        } catch (error) {
            console.error('Error fetching families:', error);
            setError(`Ошибка при загрузке семейств: ${error.message}`);
            setLoading(false);
        }
    };

    const extractCategories = (familiesData) => {
        const categories = new Set();
        
        familiesData.forEach(family => {
            if (family.technical_specs) {
                try {
                    const specs = typeof family.technical_specs === 'string' 
                        ? JSON.parse(family.technical_specs) 
                        : family.technical_specs;
                    
                    if (specs.Категория) {
                        categories.add(specs.Категория);
                    }
                    if (specs.Тип) {
                        categories.add(specs.Тип);
                    }
                } catch (e) {
                    console.warn('Failed to parse technical specs:', e);
                }
            }
        });
        
        return Array.from(categories).map(cat => ({ id: cat, name: cat }));
    };

    const sortFamilies = (families) => {
        return [...families].sort((a, b) => {
            switch (sortBy) {
                case 'name': return a.name.localeCompare(b.name);
                case 'name_desc': return b.name.localeCompare(a.name);
                case 'newest': return new Date(b.created_at || 0) - new Date(a.created_at || 0);
                case 'oldest': return new Date(a.created_at || 0) - new Date(b.created_at || 0);
                case 'images': return (b.total_images || 0) - (a.total_images || 0);
                case 'images_desc': return (a.total_images || 0) - (b.total_images || 0);
                default: return 0;
            }
        });
    };

    const filteredFamilies = families.filter(family => {
        const matchesSearch = family.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             (family.description && family.description.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesCategory = selectedCategory === 'all' || 
            (family.technical_specs && 
             JSON.stringify(family.technical_specs).toLowerCase().includes(selectedCategory.toLowerCase()));
        
        return matchesSearch && matchesCategory;
    });

    const sortedFamilies = sortFamilies(filteredFamilies);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSortChange = (e) => {
        setSortBy(e.target.value);
    };

    const handleCardClick = (family) => {
        navigate(`/bim-families/${family.id}`);
    };

    if (loading) {
        return (
            <div className="families-loading">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Загрузка...</span>
                </div>
                <p className="mt-3">Загружаем BIM семейства...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="families-error">
                <div className="alert alert-danger" role="alert">
                    <h4>Ошибка загрузки</h4>
                    <p>{error}</p>
                    <button className="btn btn-outline-danger" onClick={fetchFamilies}>
                        Попробовать снова
                    </button>
                </div>
            </div>
        );
    }

        return (
        <>
            <div className="families-background"></div>
            <div className="families-container">
                <aside className="families-sidebar">
                    <div className="sidebar-content">
                        <h2 className="sidebar-title">🔍 Фильтры и сортировка</h2>
                        
                        <div className="filter-group">
                            <label>📊 Сортировка</label>
                            <select value={sortBy} onChange={handleSortChange}>
                                <option value="name">По названию (А-Я)</option>
                                <option value="name_desc">По названию (Я-А)</option>
                                <option value="newest">Сначала новые</option>
                                <option value="oldest">Сначала старые</option>
                                <option value="images">По количеству изображений (убывание)</option>
                                <option value="images_desc">По количеству изображений (возрастание)</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>🏷️ Категория</label>
                            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                                <option value="all">Все категории</option>
                                {categories.map(category => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>🔍 Поиск</label>
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Поиск семейств..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </aside>

                <main className="families-main">
                    <div className="page-header">
                        <h1>🏗️ Каталог BIM семейств</h1>
                        <p className="page-subtitle">Профессиональные семейства Revit для архитектурных и строительных проектов</p>
                        {sortedFamilies.length > 0 && (
                            <div className="families-count">
                                Найдено семейств: <strong>{sortedFamilies.length}</strong>
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                            <p>Загрузка семейств...</p>
                        </div>
                    ) : error ? (
                        <div className="error-container">
                            <p>❌ {error}</p>
                        </div>
                    ) : sortedFamilies.length === 0 ? (
                        <div className="no-families">
                            <p>🔍 Семейства не найдены</p>
                            <p>Попробуйте изменить параметры фильтрации</p>
                        </div>
                    ) : (
                        <div className="families-grid">
                            {sortedFamilies.map(family => (
                                <div key={family.id} className="family-item">
                                    <BimFamilyCard 
                                        family={family} 
                                        onCardClick={handleCardClick}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}

export default Families;