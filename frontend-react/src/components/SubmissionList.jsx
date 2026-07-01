import React, { useState, useEffect } from 'react';
import API from '../services/api';

const SubmissionList = ({ assignmentId }) => {
    const [submissions, setSubmissions] = useState([]);

    useEffect(() => {
        const fetchSubmissions = async () => {
            try {
                const res = await API.get(`/api/classroom/submissions/for_assignment/?assignment_id=${assignmentId}`);
                setSubmissions(res.data);
            } catch (err) {
                console.error("Error fetching submissions:", err);
            }
        };
        fetchSubmissions();
    }, [assignmentId]);

    return (
        <div>
            <h4>Student Submissions</h4>
            {submissions.map(sub => (
                <div key={sub.id} style={{ border: '1px solid #ddd', margin: '10px 0', padding: '10px' }}>
                    <p>Student ID: {sub.student}</p>
                    <p>Note: {sub.content}</p>
                    {sub.file && <a href={sub.file} target="_blank">Download Submission</a>}
                </div>
            ))}
        </div>
    );
};

export default SubmissionList;
