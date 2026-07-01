// frontend-react/src/components/ClassroomDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import API from '../services/api';
import AssignmentForm from './AssignmentForm'; // Importing your form

const ClassroomDetail = () => {
    const { id } = useParams();
    const [classroom, setClassroom] = useState(null);
    const [assignments, setAssignments] = useState([]);

    const fetchDetails = async () => {
        try {
            // Fetch classroom details
            const classRes = await API.get(`/api/classroom/classrooms/${id}/`);
            setClassroom(classRes.data);
            
            // Fetch assignments
            const assignRes = await API.get(`/api/classroom/classrooms/${id}/assignments/`);
            setAssignments(assignRes.data);
        } catch (err) {
            console.error("Error fetching data:", err);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [id]);

    if (!classroom) return <div>Loading...</div>;

    return (
        <div>
            <h1>{classroom.name}</h1>
            <h3>Subject: {classroom.subject}</h3>
            
            <hr />
            
            <h4>Assignments</h4>
            <ul>
                {assignments.map(a => (
                    <li key={a.id}>
                        <strong>{a.title}</strong>: {a.description}
                    </li>
                ))}
            </ul>

            <hr />

            {/* Pass classroom ID and the refresh function */}
            <AssignmentForm 
                classroomId={id} 
                onAssignmentCreated={fetchDetails} 
            />
        </div>
    );
};

export default ClassroomDetail;