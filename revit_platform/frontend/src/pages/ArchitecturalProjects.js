import React, { useState, useEffect } from 'react'; 
import axios from 'axios';
import ProjectCard from '../components/ProjectCard';
import './Projects.css';

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
        if (filters.object_type && project.category !== filters.object_type) return false;
        
        const area = parseInt(project.total_area);
        if (filters.area) {
            if ((filters.area === 'small' && area > 100) ||
                (filters.area === 'medium' && (area <= 100 || area > 200)) ||
                (filters.area === 'large' && area <= 200)) return false;
        }

        const price = parseInt(project.design_cost);
        if (filters.price) {
            if ((filters.price === 'economy' && price > 50000) ||
                (filters.price === 'standard' && (price <= 50000 || price > 150000)) ||
                (filters.price === 'premium' && price <= 150000)) return false;
        }

        return true;
    });

    const sortedProjects = sortProjects(filteredProjects);

    return (
        <>
            <div className="projects-background"></div>
            <div className="projects-container">
                <aside className="projects-sidebar">
                    <div className="sidebar-content">
                        <h2 className="sidebar-title">🔍 Фильтры и сортировка</h2>
                        
                        <div className="filter-group">
                            <label>📊 Сортировка</label>
                            <select value={sortBy} onChange={handleSortChange}>
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

                        <div className="filter-group">
                            <label>🏗️ Тип объекта</label>
                            <select name="object_type" value={filters.object_type} onChange={handleFilterChange}>
                                <option value="">Все типы</option>
                                <option value="RESIDENTIAL">Жилые дома</option>
                                <option value="COMMERCIAL">Коммерческая недвижимость</option>
                                <option value="INDUSTRIAL">Промышленные объекты</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>📐 Площадь</label>
                            <select name="area" value={filters.area} onChange={handleFilterChange}>
                                <option value="">Любая площадь</option>
                                <option value="small">до 100 м²</option>
                                <option value="medium">100-200 м²</option>
                                <option value="large">более 200 м²</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>💰 Стоимость</label>
                            <select name="price" value={filters.price} onChange={handleFilterChange}>
                                <option value="">Любая стоимость</option>
                                <option value="economy">до 50000 ₽</option>
                                <option value="standard">50000-150000 ₽</option>
                                <option value="premium">более 150000 ₽</option>
                            </select>
                        </div>
                    </div>
                </aside>

                <main className="projects-main">
                    <div className="page-header">
                        <h1>🏛️ Каталог архитектурных проектов</h1>
                        <p className="page-subtitle">Откройте для себя уникальные архитектурные решения для ваших проектов</p>
                        {sortedProjects.length > 0 && (
                            <div className="projects-count">
                                Найдено проектов: <strong>{sortedProjects.length}</strong>
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                            <p>Загрузка проектов...</p>
                        </div>
                    ) : error ? (
                        <div className="error-container">
                            <p>❌ {error}</p>
                        </div>
                    ) : sortedProjects.length === 0 ? (
                        <div className="no-projects">
                            <p>🔍 Проекты не найдены</p>
                            <p>Попробуйте изменить параметры фильтрации</p>
                        </div>
                    ) : (
                        <div className="projects-grid">
                            {sortedProjects.map((project) => (
                                <ProjectCard key={project.id} project={project} />
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}

export default ArchitecturalProjects;
