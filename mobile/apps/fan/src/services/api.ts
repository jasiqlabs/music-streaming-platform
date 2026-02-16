import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosHeaders } from 'axios';

const API_BASE_URL = 'http://192.168.31.184:8000/api';
const HOST_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');
export const JWT_STORAGE_KEY = 'jwt';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

export const apiV1 = axios.create({
  baseURL: `${HOST_BASE_URL}/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(JWT_STORAGE_KEY);

  if (token) {
    const headers =
      config.headers instanceof AxiosHeaders
        ? config.headers
        : new AxiosHeaders(config.headers);

    headers.set('Authorization', `Bearer ${token}`);
    config.headers = headers;
  }

  return config;
});

apiV1.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(JWT_STORAGE_KEY);

  if (token) {
    const headers =
      config.headers instanceof AxiosHeaders
        ? config.headers
        : new AxiosHeaders(config.headers);

    headers.set('Authorization', `Bearer ${token}`);
    config.headers = headers;
  }

  return config;
});
