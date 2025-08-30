import React, { useState, useEffect } from 'react';
import './Projects.css';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import ProjectForm from '../components/ProjectForm';

function Projects() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const navigate = useNavigate();
    const isAuthenticated = !!localStorage.getItem('access_token');

    useEffect(() => {
        if (isAuthenticated) {
            fetchProjects();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated]);

    const fetchProjects = async () => {
        try {
            const response = await api.get('/projects/');
            console.log('Projects API Response:', response.data);
            setProjects(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching projects:', err.response || err);
            setError(err.response?.data?.detail || 'Ошибка при загрузке проектов');
            setLoading(false);
        }
    };

    const handleCreateProject = async (formData, uploadedFiles) => {
        try {
            const data = new FormData();
            
            // Основная информация
            data.append('name', formData.name);
            data.append('description', formData.description);
            data.append('status', formData.status);
            
            // Поля для BIM-менеджера
            data.append('object_code', formData.object_code);
            data.append('design_stage', formData.design_stage);
            data.append('construction_queue', formData.construction_queue);
            data.append('launch_complexes', formData.launch_complexes);
            
            // ТЭП
            if (formData.floors) data.append('floors', formData.floors);
            if (formData.total_area) data.append('total_area', formData.total_area);
            if (formData.building_area) data.append('building_area', formData.building_area);
            if (formData.construction_volume) data.append('construction_volume', formData.construction_volume);
            data.append('structural_system', formData.structural_system);
            
            // Архитектурная часть
            data.append('architectural_concept', formData.architectural_concept);
            data.append('facade_materials', formData.facade_materials);
            data.append('interior_finish', formData.interior_finish);
            data.append('landscape_design', formData.landscape_design);
            
            // Конструктивная часть
            data.append('foundation_type', formData.foundation_type);
            data.append('wall_materials', formData.wall_materials);
            data.append('roof_type', formData.roof_type);
            data.append('seismic_resistance', formData.seismic_resistance);
            
            // Водоснабжение и канализация
            data.append('water_supply_system', formData.water_supply_system);
            data.append('sewerage_system', formData.sewerage_system);
            data.append('cold_water_system', formData.cold_water_system);
            if (formData.water_consumption) data.append('water_consumption', formData.water_consumption);
            
            // Отопление и вентиляция
            data.append('heating_system', formData.heating_system);
            data.append('ventilation_system', formData.ventilation_system);
            data.append('air_conditioning', formData.air_conditioning);
            if (formData.heating_load) data.append('heating_load', formData.heating_load);
            
            // Электроснабжение
            data.append('electrical_system', formData.electrical_system);
            if (formData.electrical_load) data.append('electrical_load', formData.electrical_load);
            data.append('backup_power', formData.backup_power);
            data.append('grounding_system', formData.grounding_system);
            
            // Сети связи
            data.append('communication_networks', formData.communication_networks);
            data.append('security_systems', formData.security_systems);
            data.append('automation_systems', formData.automation_systems);
            data.append('it_infrastructure', formData.it_infrastructure);
            
            // Пожарная безопасность
            data.append('fire_safety', formData.fire_safety);
            data.append('evacuation_routes', formData.evacuation_routes);
            data.append('fire_extinguishing', formData.fire_extinguishing);
            
            // Экология и энергоэффективность
            data.append('energy_efficiency', formData.energy_efficiency);
            data.append('environmental_impact', formData.environmental_impact);
            data.append('sustainability_features', formData.sustainability_features);
            
            // Файлы
            uploadedFiles.forEach((file, index) => {
                data.append(`files[${index}]`, file);
            });

            const response = await api.post('/projects/', data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });
            
            setProjects([...projects, response.data]);
            setShowCreateForm(false);
        } catch (err) {
            console.error('Error creating project:', err.response || err);
            setError(err.response?.data?.detail || 'Ошибка при создании проекта');
        }
    };

    const handleUpdateProject = async (projectId, formData, uploadedFiles) => {
        try {
            const data = new FormData();
            
            // Основная информация
            data.append('name', formData.name);
            data.append('description', formData.description);
            data.append('status', formData.status);
            
            // Поля для BIM-менеджера
            data.append('object_code', formData.object_code);
            data.append('design_stage', formData.design_stage);
            data.append('construction_queue', formData.construction_queue);
            data.append('launch_complexes', formData.launch_complexes);
            
            // ТЭП
            if (formData.floors) data.append('floors', formData.floors);
            if (formData.total_area) data.append('total_area', formData.total_area);
            if (formData.building_area) data.append('building_area', formData.building_area);
            if (formData.construction_volume) data.append('construction_volume', formData.construction_volume);
            data.append('structural_system', formData.structural_system);
            
            // Архитектурная часть
            data.append('architectural_concept', formData.architectural_concept);
            data.append('facade_materials', formData.facade_materials);
            data.append('interior_finish', formData.interior_finish);
            data.append('landscape_design', formData.landscape_design);
            
            // Конструктивная часть
            data.append('foundation_type', formData.foundation_type);
            data.append('wall_materials', formData.wall_materials);
            data.append('roof_type', formData.roof_type);
            data.append('seismic_resistance', formData.seismic_resistance);
            
            // Водоснабжение и канализация
            data.append('water_supply_system', formData.water_supply_system);
            data.append('sewerage_system', formData.sewerage_system);
            data.append('cold_water_system', formData.cold_water_system);
            if (formData.water_consumption) data.append('water_consumption', formData.water_consumption);
            
            // Отопление и вентиляция
            data.append('heating_system', formData.heating_system);
            data.append('ventilation_system', formData.ventilation_system);
            data.append('air_conditioning', formData.air_conditioning);
            if (formData.heating_load) data.append('heating_load', formData.heating_load);
            
            // Электроснабжение
            data.append('electrical_system', formData.electrical_system);
            if (formData.electrical_load) data.append('electrical_load', formData.electrical_load);
            data.append('backup_power', formData.backup_power);
            data.append('grounding_system', formData.grounding_system);
            
            // Сети связи
            data.append('communication_networks', formData.communication_networks);
            data.append('security_systems', formData.security_systems);
            data.append('automation_systems', formData.automation_systems);
            data.append('it_infrastructure', formData.it_infrastructure);
            
            // Пожарная безопасность
            data.append('fire_safety', formData.fire_safety);
            data.append('evacuation_routes', formData.evacuation_routes);
            data.append('fire_extinguishing', formData.fire_extinguishing);
            
            // Экология и энергоэффективность
            data.append('energy_efficiency', formData.energy_efficiency);
            data.append('environmental_impact', formData.environmental_impact);
            data.append('sustainability_features', formData.sustainability_features);
            
            // Файлы
            uploadedFiles.forEach((file, index) => {
                data.append(`files[${index}]`, file);
            });

            const response = await api.put(`/projects/${projectId}/`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });
            
            setProjects(projects.map(project => 
                project.id === projectId ? response.data : project
            ));
            setEditingProject(null);
        } catch (err) {
            console.error('Error updating project:', err.response || err);
            setError(err.response?.data?.detail || 'Ошибка при обновлении проекта');
        }
    };

    const handleDeleteProject = async (projectId) => {
        if (window.confirm('Вы уверены, что хотите удалить этот проект?')) {
            try {
                await api.delete(`/projects/${projectId}/`);
                setProjects(projects.filter(project => project.id !== projectId));
            } catch (err) {
                console.error('Error deleting project:', err);
                setError(err.response?.data?.detail || 'Ошибка при удалении проекта');
            }
        }
    };

    const handleProjectClick = (project) => {
        setEditingProject(project);
    };

    const handleCancelEdit = () => {
        setEditingProject(null);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Дата не указана';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'draft':
                return 'Черновик';
            case 'in_progress':
                return 'В работе';
            case 'completed':
                return 'Завершен';
            default:
                return 'Неизвестно';
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'draft':
                return 'status-draft';
            case 'in_progress':
                return 'status-progress';
            case 'completed':
                return 'status-completed';
            default:
                return 'status-unknown';
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="projects-container">
                <div className="projects-content">
                    <div className="text-center">
                        <h2>Доступ к проектам</h2>
                        <p>Для просмотра и работы с проектами необходимо войти в систему</p>
                        <button 
                            className="btn btn-primary"
                            onClick={() => navigate('/login')}
                        >
                            Войти в систему
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="projects-container">
                <div className="projects-content">
                    <div className="text-center">
                        <div className="spinner-border" role="status">
                            <span className="visually-hidden">Загрузка...</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="projects-container">
            <div className="projects-content">
                <div className="projects-header">
                    <h2>Управление проектами</h2>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowCreateForm(!showCreateForm)}
                    >
                        {showCreateForm ? 'Отмена' : 'Создать проект'}
                    </button>
                </div>

                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}

                {showCreateForm && (
                    <ProjectForm 
                        onSubmit={handleCreateProject}
                        onCancel={() => setShowCreateForm(false)}
                    />
                )}

                {editingProject && (
                    <ProjectForm 
                        project={editingProject}
                        isEditing={true}
                        onSubmit={(formData, uploadedFiles) => handleUpdateProject(editingProject.id, formData, uploadedFiles)}
                        onCancel={handleCancelEdit}
                    />
                )}

                <div className="projects-grid">
                    {projects.map(project => (
                        <div 
                            key={project.id} 
                            className="project-card"
                            onClick={() => handleProjectClick(project)}
                        >
                            <div className="project-info">
                                <h5 className="project-title">{project.name}</h5>
                                <p className="project-description">{project.description}</p>
                                <div className="project-metadata">
                                    <div className="project-details">
                                        <span className={`project-status ${getStatusClass(project.status)}`}>
                                            {getStatusText(project.status)}
                                        </span>
                                        <span className="project-date">
                                            <i className="fas fa-calendar-alt"></i>
                                            {formatDate(project.created_at)}
                                        </span>
                                    </div>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteProject(project.id);
                                        }}
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {projects.length === 0 && !loading && (
                    <div className="text-center mt-4">
                        <p>Нет доступных проектов</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Projects;
