import api from './api';

class ProjectsService {
    async getAllProjects() {
        try {
            const response = await api.get('/projects/');
            return response.data;
        } catch (error) {
            console.error('Error fetching projects:', error);
            throw error;
        }
    }

    async getProjectById(id) {
        try {
            const response = await api.get(`/projects/${id}/`);
            return response.data;
        } catch (error) {
            console.error('Error fetching project:', error);
            throw error;
        }
    }

    async createProject(projectData) {
        try {
            const response = await api.post('/projects/', projectData);
            return response.data;
        } catch (error) {
            console.error('Error creating project:', error);
            throw error;
        }
    }

    async updateProject(id, projectData) {
        try {
            const response = await api.put(`/projects/${id}/`, projectData);
            return response.data;
        } catch (error) {
            console.error('Error updating project:', error);
            throw error;
        }
    }

    async deleteProject(id) {
        try {
            await api.delete(`/projects/${id}/`);
        } catch (error) {
            console.error('Error deleting project:', error);
            throw error;
        }
    }
}

export default new ProjectsService();