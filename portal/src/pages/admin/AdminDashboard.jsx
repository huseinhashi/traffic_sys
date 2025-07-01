import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useApiRequest } from "@/hooks/useApiRequest";
import { format } from "date-fns";
import {
  UserCog, User, AlertTriangle, AlertCircle, Clock, MessageSquare, Users, PieChart, BarChart2, Wifi, WifiOff, RefreshCw, Plus, TrendingUp, Activity, Shield, Eye
} from "lucide-react";
import { Pie, Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement);

export const AdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { request } = useApiRequest();
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [jamPosts, setJamPosts] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [recentJamPosts, setRecentJamPosts] = useState([]);
  const [recentConversations, setRecentConversations] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch users
      const usersRes = await request({ method: "GET", url: "/users" });
      const usersData = usersRes.data || [];
      setUsers(usersData);
      setRecentUsers(usersData.slice(0, 5));

      // Fetch jam posts
      const jamPostsRes = await request({ method: "GET", url: "/jam-posts" });
      const jamPostsData = jamPostsRes.data || [];
      setJamPosts(jamPostsData);
      setRecentJamPosts(jamPostsData.slice(0, 5));

      // Fetch conversations
      const convRes = await request({ method: "GET", url: "/conversations" });
      const convData = convRes.data || [];
      setConversations(convData);
      setRecentConversations(convData.slice(0, 5));

      // Fetch all messages (aggregate from all conversations)
      let allMessages = [];
      for (const conv of convData.slice(0, 10)) { // limit to 10 for performance
        try {
          const msgRes = await request({ method: "GET", url: `/conversations/${conv.id}/messages` });
          allMessages = allMessages.concat(msgRes.data || []);
        } catch {}
      }
      setMessages(allMessages);

      setIsLoading(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
      });
      setIsLoading(false);
    }
  };

  // Stats
  const totalUsers = users.length;
  const totalAdmins = users.filter(u => u.role === "admin").length;
  const totalJamPosts = jamPosts.length;
  const totalConversations = conversations.length;
  const totalMessages = messages.length;

  // Jam post levels
  const jamLevels = ["low", "medium", "high", "critical"];
  const jamLevelCounts = jamLevels.map(level => jamPosts.filter(j => j.level === level).length);

  // User roles
  const userRoles = ["user", "admin"];
  const userRoleCounts = userRoles.map(role => users.filter(u => u.role === role).length);

  // Jam posts over time (by day)
  const jamPostsByDay = {};
  jamPosts.forEach(j => {
    const day = format(new Date(j.createdAt), "yyyy-MM-dd");
    jamPostsByDay[day] = (jamPostsByDay[day] || 0) + 1;
  });
  const jamPostsDays = Object.keys(jamPostsByDay).sort();
  const jamPostsCounts = jamPostsDays.map(day => jamPostsByDay[day]);

  // Staff availability (if you have this field)
  const staff = users.filter(u => u.role === "user");
  const staffAvailable = staff.length; // You can adjust this if you have an 'active' field
  const staffAvailability = staff.length > 0 ? 100 : 0;

  // Chart data with modern styling
  const jamLevelPieData = {
    labels: jamLevels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
    datasets: [
      {
        data: jamLevelCounts,
        backgroundColor: [
          "rgba(34, 197, 94, 0.8)",   // Green
          "rgba(234, 179, 8, 0.8)",   // Yellow
          "rgba(249, 115, 22, 0.8)",  // Orange
          "rgba(239, 68, 68, 0.8)"    // Red
        ],
        borderColor: [
          "rgb(34, 197, 94)",
          "rgb(234, 179, 8)",
          "rgb(249, 115, 22)",
          "rgb(239, 68, 68)"
        ],
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const userRolePieData = {
    labels: ["Users", "Admins"],
    datasets: [
      {
        data: userRoleCounts,
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(142, 76, 36, 0.8)"
        ],
        borderColor: [
          "rgb(59, 130, 246)",
          "rgb(142, 76, 36)"
        ],
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const jamPostsLineData = {
    labels: jamPostsDays,
    datasets: [
      {
        label: "Jam Posts",
        data: jamPostsCounts,
        fill: true,
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        borderColor: "rgb(99, 102, 241)",
        borderWidth: 3,
        tension: 0.4,
        pointBackgroundColor: "rgb(99, 102, 241)",
        pointBorderColor: "white",
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
            weight: '500'
          }
        }
      }
    }
  };

  const levelColors = {
    low: "bg-emerald-100 text-emerald-800 border-emerald-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    high: "bg-orange-100 text-orange-800 border-orange-200",
    critical: "bg-red-100 text-red-800 border-red-200"
  };

  const roleColors = {
    user: "bg-blue-100 text-blue-800 border-blue-200",
    admin: "bg-purple-100 text-purple-800 border-purple-200"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-slate-600 text-lg">
              Welcome back, {user?.name}. Here's what's happening today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              System Online
            </div>
            <Button 
              onClick={fetchDashboardData} 
              disabled={isLoading} 
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <RefreshCw className={isLoading ? "h-4 w-4 animate-spin mr-2" : "h-4 w-4 mr-2"} />
              {isLoading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        {/* Enhanced Stat Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50 hover:shadow-xl transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent"></div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
              <CardTitle className="text-sm font-semibold text-slate-700">Total Users</CardTitle>
              <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                <User className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-slate-900 mb-1">{totalUsers.toLocaleString()}</div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs font-medium">
                  {totalAdmins} Admins
                </Badge>
                <TrendingUp className="h-3 w-3 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100/50 hover:shadow-xl transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 to-transparent"></div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
              <CardTitle className="text-sm font-semibold text-slate-700">Jam Posts</CardTitle>
              <div className="p-2 bg-orange-500/10 rounded-lg group-hover:bg-orange-500/20 transition-colors">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-slate-900 mb-1">{totalJamPosts.toLocaleString()}</div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="text-xs font-medium">
                  {jamPosts.filter(j => j.level === "critical").length} Critical
                </Badge>
                <Activity className="h-3 w-3 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50 hover:shadow-xl transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-transparent"></div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
              <CardTitle className="text-sm font-semibold text-slate-700">Conversations</CardTitle>
              <div className="p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                <MessageSquare className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-slate-900 mb-1">{totalConversations.toLocaleString()}</div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs font-medium">
                  {totalMessages} Messages
                </Badge>
                <MessageSquare className="h-3 w-3 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100/50 hover:shadow-xl transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent"></div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
              <CardTitle className="text-sm font-semibold text-slate-700">Admin Users</CardTitle>
              <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-slate-900 mb-1">{totalAdmins.toLocaleString()}</div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs font-medium">
                  System Administrators
                </Badge>
                <Users className="h-3 w-3 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Charts Section */}
        <div className="grid gap-8 lg:grid-cols-2">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-800">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                  <PieChart className="h-5 w-5 text-white" />
                </div>
                Jam Posts Distribution
              </CardTitle>
              <CardDescription className="text-slate-600">
                Breakdown of jam posts by severity level
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <Pie data={jamLevelPieData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-800">
                <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
                User Role Distribution
              </CardTitle>
              <CardDescription className="text-slate-600">
                Platform users by role type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <Pie data={userRolePieData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-800">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg">
                <BarChart2 className="h-5 w-5 text-white" />
              </div>
              Jam Posts Timeline
            </CardTitle>
            <CardDescription className="text-slate-600">
              Daily jam post activity over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Line data={jamPostsLineData} options={{...chartOptions, maintainAspectRatio: false}} />
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Recent Activity Section */}
        <div className="grid gap-8 lg:grid-cols-3">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold text-slate-800">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-white" />
                </div>
                Recent Jam Posts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentJamPosts.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent jam posts</p>
                  </div>
                ) : (
                  recentJamPosts.map(j => (
                    <div key={j.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <Badge className={`text-xs font-medium border ${levelColors[j.level] || levelColors.low}`}>
                          {j.level}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {j.note || "No description"}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {format(new Date(j.createdAt), "MMM d, h:mm a")}
                          </p>
                        </div>
                        <Link to={`/admin/jam-posts/${j.id}`}>
                          <Button size="sm" variant="outline" className="shrink-0">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold text-slate-800">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                  <MessageSquare className="h-4 w-4 text-white" />
                </div>
                Recent Conversations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentConversations.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent conversations</p>
                  </div>
                ) : (
                  recentConversations.map(c => (
                    <div key={c.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {c.user1?.name} & {c.user2?.name}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {format(new Date(c.createdAt), "MMM d, h:mm a")}
                          </p>
                        </div>
                        <Link to={`/admin/conversations/${c.id}`}>
                          <Button size="sm" variant="outline" className="shrink-0">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold text-slate-800">
                <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                  <User className="h-4 w-4 text-white" />
                </div>
                Recent Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentUsers.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent users</p>
                  </div>
                ) : (
                  recentUsers.map(u => (
                    <div key={u.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                          {u.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-slate-900 truncate">{u.name}</p>
                            <Badge className={`text-xs font-medium border ${roleColors[u.role] || roleColors.user}`}>
                              {u.role}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 truncate">{u.email}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};