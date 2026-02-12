import SlackDigest from '@/components/SlackDigest';
import { DollarSign, Calendar, TrendingUp, Users } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-teal-50 via-white to-brand-cream">
      <header className="bg-gradient-to-r from-brand-teal to-brand-teal-light text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl">
              🌱
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Grassroots Marketing LLC</h1>
              <p className="text-brand-cream opacity-90">Business Dashboard</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Monthly Revenue"
            value="$132,450"
            subtitle="Current month"
            icon={<DollarSign className="w-6 h-6" />}
            trend={8.3}
          />
          <KPICard
            title="Active Events"
            value="8"
            subtitle="This week"
            icon={<Calendar className="w-6 h-6" />}
          />
          <KPICard
            title="Demo Locations"
            value="47"
            subtitle="Across all chains"
            icon={<TrendingUp className="w-6 h-6" />}
          />
          <KPICard
            title="Team Members"
            value="524"
            subtitle="Brand ambassadors"
            icon={<Users className="w-6 h-6" />}
          />
        </div>

        <SlackDigest />
      </main>
    </div>
  );
}

function KPICard({
  title,
  value,
  subtitle,
  icon,
  trend,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  trend?: number;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6 border-t-4 border-brand-teal hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="text-brand-teal">{icon}</div>
        {trend && (
          <span className={`text-xs font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="text-3xl font-bold text-gray-800 mb-1">{value}</div>
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-xs text-gray-400 mt-1">{subtitle}</div>
    </div>
  );
}
