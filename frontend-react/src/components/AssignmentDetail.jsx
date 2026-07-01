import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import API from '../services/api';
import SubmissionForm from './SubmissionForm';

const AssignmentDetail = () => {
    const { id } = useParams();
    const [assignment, setAssignment] = useState(null);

    useEffect(() => {
        const fetchAssignment = async () => {
            try {
                const res = await API.get(`/api/classroom/assignments/${id}/`);
                setAssignment(res.data);
            } catch (err) {
                console.error("Error fetching assignment:", err);
            }
        };
        fetchAssignment();
    }, [id]);

    if (!assignment) return <div>Loading assignment...</div>;

    return (
        <div style={{ padding: '20px' }}>
            <h1>{assignment.title}</h1>
            <p>{assignment.description}</p>
            
            {/* If there is a reference file from the teacher */}
            {assignment.reference_file && (
                <a href={assignment.reference_file} target="_blank" rel="noreferrer">
                    Download Reference Material
                </a>
            )}

            <hr />
            
            {/* Student submission area */}
            <SubmissionForm assignmentId={id} />
        </div>
    );
};

export default AssignmentDetail;