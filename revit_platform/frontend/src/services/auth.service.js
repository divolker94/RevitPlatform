import axios from 'axios';

const API_URL = 'http://localhost:8000/api/auth/jwt';

class AuthService {
	getToken() {
		return localStorage.getItem('token') || null;
	}

	setToken(token) {
		if (token) {
			localStorage.setItem('token', token);
		}
	}

	getRefreshToken() {
		return localStorage.getItem('refresh_token') || null;
	}

	setRefreshToken(refreshToken) {
		if (refreshToken) {
			localStorage.setItem('refresh_token', refreshToken);
		}
	}

	// Обновление access-токена по refresh (SimpleJWT)
	async refreshToken() {
		try {
			const refreshToken = this.getRefreshToken();
			if (!refreshToken) {
				throw new Error('Токен обновления отсутствует');
			}

			const response = await axios.post(`${API_URL}/refresh/`, { refresh: refreshToken });
			const { access } = response.data;

			if (access) {
				this.setToken(access);
				return access;
			}

			throw new Error('Новый токен не получен');
		} catch (error) {
			this.logout();
			throw new Error(error.response?.data?.detail || 'Ошибка обновления токена');
		}
	}

	logout() {
		localStorage.removeItem('token');
		localStorage.removeItem('refresh_token');
	}

	isAuthenticated() {
		return !!this.getToken();
	}
}

export default new AuthService();