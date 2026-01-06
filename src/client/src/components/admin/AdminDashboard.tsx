export const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 sm:mb-8">
          Softball Digital Signage - Admin Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AdminCard
            title="Players"
            description="Manage player roster, stats, and information"
            link="/admin/players"
          />
          <AdminCard
            title="Sessions"
            description="Schedule and manage display sessions"
            link="/admin/sessions"
          />
          <AdminCard
            title="Content"
            description="Upload and manage signage content"
            link="/admin/content"
          />
          <AdminCard title="View Display" description="Preview the live signage display" link="/" />
        </div>

        <div className="mt-8 sm:mt-12 bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
            Quick Start Guide
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-sm sm:text-base text-gray-700">
            <li>
              Add <strong>Players</strong> to your roster with their stats and graduation year
            </li>
            <li>
              Upload <strong>Content</strong> (photos, videos) for display
            </li>
            <li>
              Create <strong>Sessions</strong> with start/end times
            </li>
            <li>
              Create <strong>Sessions</strong> and assign players with start/end times
            </li>
            <li>
              Upload <strong>Content</strong> like Play of the Week videos and images
            </li>
            <li>
              View the <strong>Display</strong> to see the signage in action
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

interface AdminCardProps {
  title: string;
  description: string;
  link: string;
}

const AdminCard = ({ title, description, link }: AdminCardProps) => (
  <a
    href={link}
    className="bg-white rounded-lg shadow-md p-5 sm:p-6 hover:shadow-lg transition-shadow min-h-[120px] flex flex-col justify-center"
  >
    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{title}</h3>
    <p className="text-sm sm:text-base text-gray-600">{description}</p>
  </a>
);
