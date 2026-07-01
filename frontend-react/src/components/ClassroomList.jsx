import API from '../services/api'; // Your already-existing service

const fetchClassrooms = async () => {
    try {
        // Because your API.defaults.baseURL is set, this will request
        // http://127.0.0.1:8000/api/classroom/classrooms/
        const response = await API.get('/api/classroom/classrooms/');
        console.log(response.data);
    } catch (error) {
        console.error("Failed to fetch classrooms", error);
    }
};