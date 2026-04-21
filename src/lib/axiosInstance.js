import axios from 'axios';

// Membuat "mesin" pemanggil API khusus untuk LUMEN
const api = axios.create({
    // Arahkan ke port backend kamu
    baseURL: 'http://localhost:5000/api', 
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor: Otomatis menyisipkan Token JWT ke setiap request (jika user sudah login)
api.interceptors.request.use(
    (config) => {
        // Asumsinya token disimpan di localStorage saat login berhasil
        const token = localStorage.getItem('lumen_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;