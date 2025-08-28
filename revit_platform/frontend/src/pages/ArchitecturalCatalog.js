import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import ProjectCard from '../components/ProjectCard';
import './Catalog.css';

function ArchitecturalCatalog() {
    const location = useLocation();
    const [projects, setProjects] = useState([]);
    const [filteredProjects, setFilteredProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        object_type: '',
        area: '',
        price: ''
    });

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/architectural-projects/', {
                    withCredentials: true,
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    }
                });
                console.log('API Response:', response.data);
                setProjects(response.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching projects:', err.response || err);
                setError(err.response?.data?.detail || 'Ошибка при загрузке проектов');
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    // Обработка поисковых запросов из URL
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const search = searchParams.get('search');
        if (search) {
            setSearchQuery(search);
        }
    }, [location.search]);

    // Фильтрация проектов по поиску и фильтрам
    useEffect(() => {
        let filtered = projects;

        // Поиск по названию и категории
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(project => 
                project.name?.toLowerCase().includes(query) ||
                project.functional_class?.toLowerCase().includes(query) ||
                project.category?.toLowerCase().includes(query)
            );
        }

        // Применение фильтров
        filtered = filtered.filter(project => {
            if (filters.object_type && project.category !== filters.object_type) return false;
            
            if (filters.area) {
                const area = parseInt(project.total_area);
                switch(filters.area) {
                    case 'small':
                        if (area > 100) return false;
                        break;
                    case 'medium':
                        if (area <= 100 || area > 200) return false;
                        break;
                    case 'large':
                        if (area <= 200) return false;
                        break;
                    default:
                        break;
                }
            }

            if (filters.price) {
                const price = parseInt(project.design_cost);
                switch(filters.price) {
                    case 'economy':
                        if (price > 50000) return false;
                        break;
                    case 'standard':
                        if (price <= 50000 || price > 150000) return false;
                        break;
                    case 'premium':
                        if (price <= 150000) return false;
                        break;
                    default:
                        break;
                }
            }

            return true;
        });

        setFilteredProjects(filtered);
    }, [projects, searchQuery, filters]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };



    if (loading) {
        return (
            <div className="catalog-container">
                <div className="loading-spinner">
                    <i className="fas fa-spinner fa-spin"></i>
                    <span>Загрузка проектов...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="catalog-container">
                <div className="error-message">
                    <i className="fas fa-exclamation-circle"></i>
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()} className="btn btn-primary">
                        Попробовать снова
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="catalog-container">
            <div className="catalog-filters">
                <h2><i className="fas fa-filter filter-icon"></i>Фильтры и сортировка</h2>
                
                <div className="filter-group">
                    <label><i className="fas fa-building filter-icon"></i>Тип объекта</label>
                    <select 
                        className="filter-select"
                        name="object_type"
                        value={filters.object_type}
                        onChange={handleFilterChange}
                    >
                        <option value="">Все типы объектов</option>
                        <option value="RESIDENTIAL">Жилые дома</option>
                        <option value="COMMERCIAL">Коммерческая недвижимость</option>
                        <option value="INDUSTRIAL">Промышленные объекты</option>
                    </select>
                </div>
                
                <div className="filter-group">
                    <label><i className="fas fa-ruler-combined filter-icon"></i>Площадь</label>
                    <select 
                        className="filter-select"
                        name="area"
                        value={filters.area}
                        onChange={handleFilterChange}
                    >
                        <option value="">Любая площадь</option>
                        <option value="small">до 100 м²</option>
                        <option value="medium">100-200 м²</option>
                        <option value="large">более 200 м²</option>
                    </select>
                </div>
                
                <div className="filter-group">
                    <label><i className="fas fa-ruble-sign filter-icon"></i>Стоимость</label>
                    <select 
                        className="filter-select"
                        name="price"
                        value={filters.price}
                        onChange={handleFilterChange}
                    >
                        <option value="">Любая цена</option>
                        <option value="economy">до 50000 ₽</option>
                        <option value="standard">50000-150000 ₽</option>
                        <option value="premium">более 150000 ₽</option>
                    </select>
                </div>
            </div>

            <div className="catalog-content">
                <div className="catalog-header">
                    <h1><i className="fas fa-search search-icon"></i>Каталог архитектурных проектов</h1>
                    {searchQuery && (
                        <div className="search-results-info">
                            <p><i className="fas fa-search"></i> Результаты поиска по запросу: <strong>"{searchQuery}"</strong></p>
                            <p>Найдено проектов: <strong>{filteredProjects.length}</strong></p>
                            <button 
                                onClick={() => setSearchQuery('')} 
                                className="clear-search-btn"
                                title="Очистить поиск"
                            >
                                <i className="fas fa-times"></i> Очистить поиск
                            </button>
                        </div>
                    )}
                    {!searchQuery && (
                        <p>Откройте для себя уникальные архитектурные решения для ваших проектов</p>
                    )}
                </div>
                
                <div className="projects-grid">
                    {filteredProjects.length === 0 ? (
                        <div className="no-projects">
                            <i className="fas fa-folder-open"></i>
                            <p>Проекты не найдены</p>
                        </div>
                    ) : (
                        filteredProjects.map((project) => (
                            <ProjectCard key={project.id} project={project} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default ArchitecturalCatalog;