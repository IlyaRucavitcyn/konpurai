import { useEffect, useState } from "react";
import { useCallback } from "react";
import { getAllEntities } from "../repository/entity.repository";
import { Dashboard } from "../../domain/types/Dashboard";

export const useDashboard = () => {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllEntities({ routeUrl: "/dashboard" });
      // Safe access to response data
      if (response && response.data) {
        setDashboard(response.data);
      } else {
        setDashboard({});
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      setDashboard({});
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch dashboard data when the component mounts
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { dashboard, loading, fetchDashboard };
};
