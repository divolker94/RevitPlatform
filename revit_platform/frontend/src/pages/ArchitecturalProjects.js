import React, { useState, useEffect } from 'react'; 
import axios from 'axios';
import ProjectCard from '../components/ProjectCard';
import './ArchitecturalProjects.css';

function ArchitecturalProjects() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        object_type: '',
        area: '',
        price: ''
    });
    const [sortBy, setSortBy] = useState('name');
    const [searchTerm, setSearchTerm] = useState('');

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
                setProjects(response.data);
            } catch (err) {
                setError(err.response?.data?.detail || 'Ошибка при загрузке проектов');
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSortChange = (e) => {
        setSortBy(e.target.value);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const sortProjects = (projects) => {
        return [...projects].sort((a, b) => {
            switch (sortBy) {
                case 'name': return a.name.localeCompare(b.name);
                case 'name_desc': return b.name.localeCompare(a.name);
                case 'price': return a.design_cost - b.design_cost;
                case 'price_desc': return b.design_cost - a.design_cost;
                case 'area': return a.total_area - b.total_area;
                case 'area_desc': return b.total_area - a.total_area;
                case 'newest': return new Date(b.created_at) - new Date(a.created_at);
                case 'oldest': return new Date(a.created_at) - new Date(b.created_at);
                default: return 0;
            }
        });
    };

    const filteredProjects = projects.filter(project => {
        // Поиск по названию и категории
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            const nameMatch = project.name.toLowerCase().includes(searchLower);
            const categoryMatch = project.category && project.category.toLowerCase().includes(searchLower);
            const descriptionMatch = project.description && project.description.toLowerCase().includes(searchLower);
            
            if (!nameMatch && !categoryMatch && !descriptionMatch) {
                return false;
            }
        }
        
        // Фильтр по типу объекта
        if (filters.object_type && project.category !== filters.object_type) return false;
        
        // Фильтр по площади
        const area = parseInt(project.total_area);
        if (filters.area) {
            if ((filters.area === 'small' && area > 100) ||
                (filters.area === 'medium' && (area <= 100 || area > 200)) ||
                (filters.area === 'large' && area <= 200)) return false;
        }

        // Фильтр по цене
        const price = parseInt(project.design_cost);
        if (filters.price) {
            if ((filters.price === 'economy' && price > 50000) ||
                (filters.price === 'standard' && (price <= 50000 || price > 150000)) ||
                (filters.price === 'premium' && price <= 150000)) return false;
        }

        return true;
    });

    const sortedProjects = sortProjects(filteredProjects);

    if (loading) {
        return (
            <div className="architectural-projects">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Загрузка проектов...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="architectural-projects">
                <div className="error-container">
                    <h2>Ошибка загрузки</h2>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="architectural-projects">
            <aside className="filter-sidebar">
                <div className="sidebar-content">
                    <h2 className="sidebar-title">🔍 Фильтры и сортировка</h2>
                    
                    <div className="filter-section">
                        <h3>🔍 Поиск</h3>
                        <div className="filter-group">
                            <input
                                type="text"
                                placeholder="Поиск по названию, категории..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="search-input"
                            />
                        </div>
                    </div>
                    
                    <div className="filter-section">
                        <h3>📊 Сортировка</h3>
                        <div className="filter-group">
                            <select value={sortBy} onChange={handleSortChange} className="filter-select">
                                <option value="name">По названию (А-Я)</option>
                                <option value="name_desc">По названию (Я-А)</option>
                                <option value="price">По цене (возрастание)</option>
                                <option value="price_desc">По цене (убывание)</option>
                                <option value="area">По площади (возрастание)</option>
                                <option value="area_desc">По площади (убывание)</option>
                                <option value="newest">Сначала новые</option>
                                <option value="oldest">Сначала старые</option>
                            </select>
                        </div>
                    </div>

                    <div className="filter-section">
                        <h3>🏗️ Тип объекта</h3>
                        <div className="filter-group">
                            <select name="object_type" value={filters.object_type} onChange={handleFilterChange} className="filter-select">
                                <option value="">Все типы</option>
                                <option value="residential">Жилые здания</option>
                                <option value="commercial">Коммерческие здания</option>
                                <option value="industrial">Промышленные здания</option>
                                <option value="public">Общественные здания</option>
                                <option value="landscape">Ландшафтные проекты</option>
                            </select>
                        </div>
                    </div>

                    <div className="filter-section">
                        <h3>📏 Площадь</h3>
                        <div className="filter-group">
                            <select name="area" value={filters.area} onChange={handleFilterChange} className="filter-select">
                                <option value="">Любая площадь</option>
                                <option value="small">До 100 м²</option>
                                <option value="medium">100-200 м²</option>
                                <option value="large">Более 200 м²</option>
                            </select>
                        </div>
                    </div>

                    <div className="filter-section">
                        <h3>💰 Стоимость</h3>
                        <div className="filter-group">
                            <select name="price" value={filters.price} onChange={handleFilterChange} className="filter-select">
                                <option value="">Любая стоимость</option>
                                <option value="economy">До 50,000 ₽</option>
                                <option value="standard">50,000 - 150,000 ₽</option>
                                <option value="premium">Более 150,000 ₽</option>
                            </select>
                        </div>
                    </div>

                    <div className="filter-section">
                        <h3>📈 Статистика</h3>
                        <div className="stats-info">
                            <p><strong>Всего проектов:</strong> {projects.length}</p>
                            <p><strong>Показано:</strong> {sortedProjects.length}</p>
                            {searchTerm && (
                                <p><strong>Поиск:</strong> "{searchTerm}"</p>
                            )}
                        </div>
                    </div>
                </div>
            </aside>

            <main className="projects-main">
                <div className="projects-header">
                    <h1>🏛️ Каталог архитектурных проектов</h1>
                    <p>Найдите идеальный проект для вашего будущего здания</p>
                </div>

                <div className="projects-grid">
                    {sortedProjects.map(project => (
                        <ProjectCard key={project.id} project={project} />
                    ))}
                </div>

                {sortedProjects.length === 0 && (
                    <div className="no-projects">
                        <h3>😔 Проекты не найдены</h3>
                        <p>Попробуйте изменить фильтры или сбросить их</p>
                        <button 
                            className="btn btn-primary"
                            onClick={() => {
                                setFilters({ object_type: '', area: '', price: '' });
                                setSortBy('name');
                                setSearchTerm('');
                            }}
                        >
                            Сбросить фильтры
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}

export default ArchitecturalProjects;
