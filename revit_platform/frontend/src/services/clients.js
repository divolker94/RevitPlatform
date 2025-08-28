import api from './api'; // Ensure this path is correct

const clientsService = {
    // Legal Entity endpoints
    createLegalEntity: (data) => {
        return api.post('/clients/legal-entities/', data);
    },
    getLegalEntity: (id) => {
        return api.get(`/clients/legal-entities/${id}/`);
    },
    updateLegalEntity: (id, data) => {
        return api.put(`/clients/legal-entities/${id}/`, data);
    },
    deleteLegalEntity: (id) => {
        return api.delete(`/clients/legal-entities/${id}/`);
    },
    getAllLegalEntities: () => {
        return api.get('/clients/legal-entities/');
    },

    // Individual Client endpoints
    createIndividual: (data) => {
        return api.post('/clients/individuals/', data);
    },
    getIndividual: (id) => {
        return api.get(`/clients/individuals/${id}/`);
    },
    updateIndividual: (id, data) => {
        return api.put(`/clients/individuals/${id}/`, data);
    },
    deleteIndividual: (id) => {
        return api.delete(`/clients/individuals/${id}/`);
    },
    getAllIndividuals: () => {
        return api.get('/clients/individuals/');
    }
};

export default clientsService;