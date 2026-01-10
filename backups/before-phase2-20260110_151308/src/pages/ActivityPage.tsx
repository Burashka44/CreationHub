import ActivityLog from "@/components/dashboard/ActivityLog";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

const ActivityPage = () => {
  return (
    <div className="space-y-6">
      <DashboardHeader />
      <div className="max-w-3xl">
        <ActivityLog limit={100} className="h-[calc(100vh-200px)]" />
      </div>
    </div>
  );
};

export default ActivityPage;
