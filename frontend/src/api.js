import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const getFraudSummary = async () => {
  const response = await api.get('/fraud-summary');
  return response.data;
};

export const detectFraud = async () => {
  const response = await api.get('/detect-fraud');
  return response.data;
};

export const getInvoices = async () => {
  const response = await api.get('/invoices');
  return response.data;
};

export const uploadInvoice = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/analyze-invoice', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
