import { useEffect, useState } from 'react'

function App() {
  const [healthStatus, setHealthStatus] = useState<string>('Loading...');

  useEffect(() => {
    fetch('http://localhost:3000/api/health')
      .then((res) => res.json())
      .then((data) => {
        setHealthStatus(JSON.stringify(data, null, 2));
      })
      .catch((err) => {
        setHealthStatus('Error connecting to backend: ' + err.message);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-blue-600 mb-6">AI Helpdesk MVP</h1>
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Backend Health Check</h2>
        <pre className="bg-gray-800 text-green-400 p-4 rounded text-sm overflow-auto">
          {healthStatus}
        </pre>
      </div>
    </div>
  )
}

export default App
