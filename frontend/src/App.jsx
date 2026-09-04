import { useState, useEffect } from 'react';

function App() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/subjects')
      .then((res) => res.json())
      .then((data) => {
        setSubjects(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);
  // ← useEffect fully closes here with that }, []);

  // ↓ THIS is what goes next — after useEffect, still inside App()
  if (loading) return <p>Loading subjects...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="App">
      <h1>SCP Database</h1>
      <div className="subject-list">
        {subjects.map((subject) => (
          <div key={subject.id} className="subject-card">
            <h2>{subject.item}</h2>
            <p><strong>Class:</strong> {subject.class}</p>
            <p><strong>Description:</strong> {subject.description}</p>
            <p><strong>Containment:</strong> {subject.containment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;