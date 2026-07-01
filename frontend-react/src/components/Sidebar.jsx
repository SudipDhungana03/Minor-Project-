// Sidebar.jsx (Professional Layout)
const Sidebar = ({ role }) => (
  <div className="w-64 h-screen bg-white shadow-lg fixed">
    <div className="p-6 font-bold text-xl text-indigo-600">OriginalityGuard</div>
    <nav className="mt-6">
      <div className="px-6 py-2 hover:bg-gray-100 cursor-pointer">Dashboard</div>
      {role === 'teacher' && <div className="px-6 py-2 hover:bg-gray-100 cursor-pointer">Manage Classes</div>}
      <div className="px-6 py-2 hover:bg-gray-100 cursor-pointer">Assignments</div>
      <div className="px-6 py-2 hover:bg-gray-100 cursor-pointer">Settings</div>
    </nav>
  </div>
);