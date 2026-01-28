import axios from "axios";

// Main API client for Node.js server
const axiosClient = axios.create({
    baseURL: 'http://localhost:8000'
});

// Chat API client for Python server
const chatAxiosClient = axios.create({
    baseURL: 'http://localhost:5000'
});

export { axiosClient, chatAxiosClient };