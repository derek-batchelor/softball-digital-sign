import axios from 'axios';
import {
  ActiveSignageData,
  SignageContent,
  CreatePlayerDto,
  UpdatePlayerDto,
  CreateSessionDto,
  UpdateSessionDto,
  CreateSignageContentDto,
  UpdateSignageContentDto,
} from '@shared/types';
import { config } from '../config';

const api = axios.create({
  baseURL: `${config.apiUrl}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const signageApi = {
  getActiveData: () => api.get<ActiveSignageData>('/signage/active'),
  getFallbackContent: () => api.get<SignageContent[]>('/signage/fallback'),
};

export const playersApi = {
  getAll: () => api.get('/players'),
  getOne: (id: number) => api.get(`/players/${id}`),
  create: (data: CreatePlayerDto) => api.post('/players', data),
  update: (id: number, data: UpdatePlayerDto) => api.put(`/players/${id}`, data),
  delete: (id: number) => api.delete(`/players/${id}`),
  setWeekendWarrior: (id: number) => api.patch(`/players/${id}/weekend-warrior`),
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/players/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export const sessionsApi = {
  getAll: () => api.get('/sessions'),
  getActive: () => api.get('/sessions/active'),
  getOne: (id: number) => api.get(`/sessions/${id}`),
  create: (data: CreateSessionDto) => api.post('/sessions', data),
  update: (id: number, data: UpdateSessionDto) => api.put(`/sessions/${id}`, data),
  delete: (id: number) => api.delete(`/sessions/${id}`),
};

export const contentApi = {
  getAll: () => api.get('/content'),
  getActive: () => api.get('/content/active'),
  getOne: (id: number) => api.get(`/content/${id}`),
  create: (data: CreateSignageContentDto) => api.post('/content', data),
  update: (id: number, data: UpdateSignageContentDto) => api.put(`/content/${id}`, data),
  delete: (id: number) => api.delete(`/content/${id}`),
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/content/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default api;
