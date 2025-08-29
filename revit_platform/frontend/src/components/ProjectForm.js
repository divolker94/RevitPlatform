import React, { useState } from 'react';
import './ProjectForm.css';

function ProjectForm({ onSubmit, onCancel, project = null, isEditing = false }) {
    const [formData, setFormData] = useState({
        name: project?.name || '',
        description: project?.description || '',
        status: project?.status || 'draft',
        
        // Поля для BIM-менеджера
        object_code: project?.object_code || '',
        design_stage: project?.design_stage || '',
        construction_queue: project?.construction_queue || '',
        launch_complexes: project?.launch_complexes || '',
        
        // ТЭП
        floors: project?.floors || '',
        total_area: project?.total_area || '',
        building_area: project?.building_area || '',
        construction_volume: project?.construction_volume || '',
        structural_system: project?.structural_system || '',
        
        // Архитектурная часть
        architectural_concept: project?.architectural_concept || '',
        facade_materials: project?.facade_materials || '',
        interior_finish: project?.interior_finish || '',
        landscape_design: project?.landscape_design || '',
        
        // Конструктивная часть
        foundation_type: project?.foundation_type || '',
        wall_materials: project?.wall_materials || '',
        roof_type: project?.roof_type || '',
        seismic_resistance: project?.seismic_resistance || '',
        
        // Водоснабжение и канализация
        water_supply_system: project?.water_supply_system || '',
        sewerage_system: project?.sewerage_system || '',
        cold_water_system: project?.cold_water_system || '',
        water_consumption: project?.water_consumption || '',
        
        // Отопление и вентиляция
        heating_system: project?.heating_system || '',
        ventilation_system: project?.ventilation_system || '',
        air_conditioning: project?.air_conditioning || '',
        heating_load: project?.heating_load || '',
        
        // Электроснабжение
        electrical_system: project?.electrical_system || '',
        electrical_load: project?.electrical_load || '',
        backup_power: project?.backup_power || '',
        grounding_system: project?.grounding_system || '',
        
        // Сети связи
        communication_networks: project?.communication_networks || '',
        security_systems: project?.security_systems || '',
        automation_systems: project?.automation_systems || '',
        it_infrastructure: project?.it_infrastructure || '',
        
        // Пожарная безопасность
        fire_safety: project?.fire_safety || '',
        evacuation_routes: project?.evacuation_routes || '',
        fire_extinguishing: project?.fire_extinguishing || '',
        
        // Экология и энергоэффективность
        energy_efficiency: project?.energy_efficiency || '',
        environmental_impact: project?.environmental_impact || '',
        sustainability_features: project?.sustainability_features || ''
    });

    const [uploadedFiles, setUploadedFiles] = useState(project?.files || []);
    const [hasChanges, setHasChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setHasChanges(true);
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setUploadedFiles(prev => [...prev, ...files]);
        setHasChanges(true);
    };

    const handleRemoveFile = (index) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
        setHasChanges(true);
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            // Здесь можно добавить логику для сохранения изменений в локальное хранилище
            // или отправки на сервер для временного сохранения
            localStorage.setItem('project_draft', JSON.stringify({
                formData,
                uploadedFiles: uploadedFiles.map(file => ({
                    name: file.name,
                    size: file.size,
                    type: file.type
                }))
            }));
            
            setHasChanges(false);
            setIsSaving(false);
            
            // Показываем уведомление об успешном сохранении
            alert('Изменения сохранены!');
        } catch (error) {
            console.error('Ошибка при сохранении:', error);
            setIsSaving(false);
            alert('Ошибка при сохранении изменений');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (hasChanges) {
            const shouldSave = window.confirm(
                'У вас есть несохраненные изменения. Хотите сохранить их перед созданием проекта?'
            );
            if (shouldSave) {
                await handleSaveChanges();
            }
        }
        
        onSubmit(formData, uploadedFiles);
    };

    const handleCancel = () => {
        if (hasChanges) {
            const shouldCancel = window.confirm(
                'У вас есть несохраненные изменения. Вы уверены, что хотите отменить?'
            );
            if (shouldCancel) {
                onCancel();
            }
        } else {
            onCancel();
        }
    };

    return (
        <div className="project-form-container">
            <div className="project-form-card">
                <div className="project-form-header">
                    <h3>{isEditing ? 'Редактирование проекта' : 'Создание нового проекта'}</h3>
                    {hasChanges && (
                        <div className="unsaved-changes-indicator">
                            <i className="fas fa-exclamation-triangle"></i>
                            Есть несохраненные изменения
                        </div>
                    )}
                </div>
                
                <div className="project-form-body">
                    <form onSubmit={handleSubmit}>
                        {/* Основная информация */}
                        <div className="form-section">
                            <h4 className="section-title primary">Основная информация</h4>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Название проекта *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Статус</label>
                                    <select
                                        className="form-select"
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                    >
                                        <option value="draft">Черновик</option>
                                        <option value="in_progress">В работе</option>
                                        <option value="completed">Завершен</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Описание</label>
                                <textarea
                                    className="form-textarea"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows="3"
                                ></textarea>
                            </div>
                        </div>

                        {/* BIM-менеджер */}
                        <div className="form-section">
                            <h4 className="section-title">BIM-менеджер</h4>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Шифр объекта</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="object_code"
                                        value={formData.object_code}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Стадия проектирования</label>
                                    <select
                                        className="form-select"
                                        name="design_stage"
                                        value={formData.design_stage}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Выберите стадию</option>
                                        <option value="concept">Концепция</option>
                                        <option value="sketch">Эскизный проект</option>
                                        <option value="working">Рабочий проект</option>
                                        <option value="detailed">Детальная разработка</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Очередь строительства</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="construction_queue"
                                        value={formData.construction_queue}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Пусковые комплексы</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="launch_complexes"
                                        value={formData.launch_complexes}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ТЭП */}
                        <div className="form-section">
                            <h4 className="section-title">ТЭП (Технико-экономические показатели)</h4>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Этажность</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        name="floors"
                                        value={formData.floors}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Общая площадь (м²)</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        name="total_area"
                                        value={formData.total_area}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Площадь застройки (м²)</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        name="building_area"
                                        value={formData.building_area}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Строительный объем (м³)</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        name="construction_volume"
                                        value={formData.construction_volume}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Конструктивная система</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="structural_system"
                                        value={formData.structural_system}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Архитектурная часть */}
                        <div className="form-section">
                            <h4 className="section-title">Архитектурная часть</h4>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Архитектурная концепция</label>
                                    <textarea
                                        className="form-textarea"
                                        name="architectural_concept"
                                        value={formData.architectural_concept}
                                        onChange={handleInputChange}
                                        rows="2"
                                    ></textarea>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Материалы фасада</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="facade_materials"
                                        value={formData.facade_materials}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Отделка интерьера</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="interior_finish"
                                        value={formData.interior_finish}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Ландшафтный дизайн</label>
                                    <textarea
                                        className="form-textarea"
                                        name="landscape_design"
                                        value={formData.landscape_design}
                                        onChange={handleInputChange}
                                        rows="2"
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Конструктивная часть */}
                        <div className="form-section">
                            <h4 className="section-title">Конструктивная часть</h4>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Тип фундамента</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="foundation_type"
                                        value={formData.foundation_type}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Материалы стен</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="wall_materials"
                                        value={formData.wall_materials}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Тип кровли</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="roof_type"
                                        value={formData.roof_type}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Сейсмостойкость</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="seismic_resistance"
                                        value={formData.seismic_resistance}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Водоснабжение и канализация */}
                        <div className="form-section">
                            <h4 className="section-title">Водоснабжение и канализация (ВК)</h4>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Система водоснабжения</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="water_supply_system"
                                        value={formData.water_supply_system}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Система канализации</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="sewerage_system"
                                        value={formData.sewerage_system}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Система холодоснабжения</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="cold_water_system"
                                        value={formData.cold_water_system}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Расход воды (л/с)</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        name="water_consumption"
                                        value={formData.water_consumption}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Отопление и вентиляция */}
                        <div className="form-section">
                            <h4 className="section-title">Отопление и вентиляция (ОВ)</h4>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Система отопления</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="heating_system"
                                        value={formData.heating_system}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Система вентиляции</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="ventilation_system"
                                        value={formData.ventilation_system}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Кондиционирование</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="air_conditioning"
                                        value={formData.air_conditioning}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Тепловая нагрузка (кВт)</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        name="heating_load"
                                        value={formData.heating_load}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Электроснабжение */}
                        <div className="form-section">
                            <h4 className="section-title">Электроснабжение (ЭОМ)</h4>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Система электроснабжения</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="electrical_system"
                                        value={formData.electrical_system}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Электрическая нагрузка (кВт)</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        name="electrical_load"
                                        value={formData.electrical_load}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Резервное питание</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="backup_power"
                                        value={formData.backup_power}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Система заземления</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="grounding_system"
                                        value={formData.grounding_system}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Сети связи */}
                        <div className="form-section">
                            <h4 className="section-title">Сети связи (СС)</h4>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Сети связи</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="communication_networks"
                                        value={formData.communication_networks}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Системы безопасности</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="security_systems"
                                        value={formData.security_systems}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Системы автоматизации</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="automation_systems"
                                        value={formData.automation_systems}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">IT-инфраструктура</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="it_infrastructure"
                                        value={formData.it_infrastructure}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Пожарная безопасность */}
                        <div className="form-section">
                            <h4 className="section-title">Пожарная безопасность</h4>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Пожарная безопасность</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="fire_safety"
                                        value={formData.fire_safety}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Пути эвакуации</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="evacuation_routes"
                                        value={formData.evacuation_routes}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Пожаротушение</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="fire_extinguishing"
                                        value={formData.fire_extinguishing}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Экология и энергоэффективность */}
                        <div className="form-section">
                            <h4 className="section-title">Экология и энергоэффективность</h4>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Энергоэффективность</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="energy_efficiency"
                                        value={formData.energy_efficiency}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Влияние на окружающую среду</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="environmental_impact"
                                        value={formData.environmental_impact}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Устойчивые решения</label>
                                    <textarea
                                        className="form-textarea"
                                        name="sustainability_features"
                                        value={formData.sustainability_features}
                                        onChange={handleInputChange}
                                        rows="2"
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Файлы */}
                        <div className="form-section">
                            <h4 className="section-title">Файлы проекта</h4>
                            <div className="file-upload" onClick={() => document.getElementById('files').click()}>
                                <input
                                    type="file"
                                    id="files"
                                    onChange={handleFileChange}
                                    multiple
                                    accept=".pdf,.jpg,.jpeg,.png"
                                />
                                <div className="file-upload-text">
                                    <i className="fas fa-cloud-upload-alt fa-2x mb-2"></i><br />
                                    Нажмите для загрузки файлов
                                </div>
                                <div className="file-upload-hint">
                                    Поддерживаются файлы PDF и изображения JPG, PNG
                                </div>
                                {uploadedFiles.length > 0 && (
                                    <div className="mt-3">
                                        <strong>Выбрано файлов: {uploadedFiles.length}</strong>
                                    </div>
                                )}
                            </div>
                            
                            {/* Список загруженных файлов */}
                            {uploadedFiles.length > 0 && (
                                <div className="uploaded-files">
                                    <h5>Загруженные файлы:</h5>
                                    <div className="files-list">
                                        {uploadedFiles.map((file, index) => (
                                            <div key={index} className="file-item">
                                                <span className="file-name">{file.name}</span>
                                                <button
                                                    type="button"
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleRemoveFile(index)}
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="form-actions">
                            {hasChanges && (
                                <button
                                    type="button"
                                    className="btn btn-warning"
                                    onClick={handleSaveChanges}
                                    disabled={isSaving}
                                >
                                    <i className="fas fa-save"></i>
                                    {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
                                </button>
                            )}
                            <button type="submit" className="btn btn-success">
                                <i className="fas fa-check"></i>
                                {isEditing ? 'Обновить проект' : 'Создать проект'}
                            </button>
                            <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                                <i className="fas fa-times"></i>
                                Отмена
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default ProjectForm;
