import React, { useState } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Card, Input, Button } from '../components/ui';

const CreateClassroom = () => {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await API.post('/api/classroom/classrooms/', { name, subject });
      navigate('/teacher-dashboard');
    } catch (err) {
      setError('Could not create the classroom. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4 py-10">
      <Card className="w-full">
        <h1 className="text-2xl font-extrabold text-ink">Create classroom</h1>
        <p className="mt-1.5 mb-8 text-ink-soft">
          Set up a new space for your students and assignments.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Class name"
            name="name"
            placeholder="e.g. Advanced Calculus"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Subject"
            name="subject"
            placeholder="e.g. Mathematics"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <div className="flex items-center gap-3 pt-1">
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? 'Creating...' : 'Create classroom'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={() => navigate('/teacher-dashboard')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreateClassroom;
