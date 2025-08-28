import api from './api';

class BaseService {
    constructor(endpoint) {
        this.endpoint = endpoint;
    }

    getAll() {
        return api.get(`/${this.endpoint}/`);
    }

    getById(id) {
        return api.get(`/${this.endpoint}/${id}/`);
    }

    create(data) {
        return api.post(`/${this.endpoint}/`, data);
    }

    update(id, data) {
        return api.put(`/${this.endpoint}/${id}/`, data);
    }

    delete(id) {
        return api.delete(`/${this.endpoint}/${id}/`);
    }
}

export default BaseService;