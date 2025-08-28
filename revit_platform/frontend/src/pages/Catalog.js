import React, { useState, useEffect } from 'react';
import ProjectCard from '../components/ProjectCard';
import api from '../services/api';
import './Catalog.css';
import { useNavigate } from 'react-router-dom';

function Catalog() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        object_type: '',
        area: '',
        price: ''
    });
    const navigate = useNavigate();
    const isAuthenticated = !!localStorage.getItem('token');

    useEffect(() => {
        const fetchProjects = async () => {
            if (!isAuthenticated) {
                setLoading(false);
                return;
            }

            try {
                const response = await api.get('/projects/');
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
    }, [isAuthenticated]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const filteredProjects = projects.filter(project => {
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

    if (!isAuthenticated) {
        return (
            <div className="catalog-container">
                <div className="text-center">
                    <h2>Для просмотра каталога необходима авторизация</h2>
                    <button 
                        className="btn btn-primary mt-3"
                        onClick={() => navigate('/login')}
                    >
                        Войти в систему
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="catalog-container">
            <div className="catalog-header">
                <h1>Мои проекты</h1>
                <div className="catalog-filters">
                    <select 
                        className="filter-select"
                        name="object_type"
                        value={filters.object_type}
                        onChange={handleFilterChange}
                    >
                        <option value="">Тип объекта</option>
                        <option value="RESIDENTIAL">Жилые дома</option>
                        <option value="COMMERCIAL">Коммерческая недвижимость</option>
                        <option value="INDUSTRIAL">Промышленные объекты</option>
                    </select>
                    <select 
                        className="filter-select"
                        name="area"
                        value={filters.area}
                        onChange={handleFilterChange}
                    >
                        <option value="">Площадь</option>
                        <option value="small">до 100 м²</option>
                        <option value="medium">100-200 м²</option>
                        <option value="large">более 200 м²</option>
                    </select>
                    <select 
                        className="filter-select"
                        name="price"
                        value={filters.price}
                        onChange={handleFilterChange}
                    >
                        <option value="">Цена</option>
                        <option value="economy">до 50000 ₽</option>
                        <option value="standard">50000-150000 ₽</option>
                        <option value="premium">более 150000 ₽</option>
                    </select>
                </div>
            </div>

            {filteredProjects.length === 0 ? (
                <div className="no-projects">
                    <i className="fas fa-folder-open"></i>
                    <p>Проекты не найдены</p>
                </div>
            ) : (
                <div className="projects-grid">
                    {filteredProjects.map((project) => (
                        <ProjectCard key={project.id} project={project} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default Catalog;