import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, TrendingUp } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth, type AttendanceRecord } from "@/integrations/firebase/auth-context";
import { toast } from "sonner";

export default function TeacherAttendanceAnalytics() {
  const navigate = useNavigate();
  const { userProfile, logout, getAttendanceAnalytics } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  useEffect(() => {
    const loadAttendanceAnalytics = async () => {
      if (!userProfile?.assignedGrade) return;
      setAttendanceLoading(true);
      try {
        const records = await getAttendanceAnalytics(userProfile.assignedGrade);
        setAttendanceRecords(records);
      } catch {
        toast.error("Failed to load attendance data");
      } finally {
        setAttendanceLoading(false);
      }
    };
    loadAttendanceAnalytics();
  }, [userProfile?.assignedGrade]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const calculateAttendanceStats = () => {
    if (attendanceRecords.length === 0) return { totalStudents: 0, attendance: 0, byStudent: {}, byDate: {} };

    const uniqueStudents = new Set(attendanceRecords.map(r => r.studentId));
    const presentCount = attendanceRecords.filter(r => r.present).length;
    const totalRecords = attendanceRecords.length;
    const attendancePercentage = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

    const byStudent: Record<string, { present: number; total: number; percentage: number }> = {};
    uniqueStudents.forEach(studentId => {
      const records = attendanceRecords.filter(r => r.studentId === studentId);
      const present = records.filter(r => r.present).length;
      byStudent[studentId] = {
        present,
        total: records.length,
        percentage: Math.round((present / records.length) * 100) || 0,
      };
    });

    const byDate: Record<string, { present: number; total: number; percentage: number }> = {};
    const uniqueDates = new Set(attendanceRecords.map(r => r.date));
    uniqueDates.forEach(date => {
      const records = attendanceRecords.filter(r => r.date === date);
      const present = records.filter(r => r.present).length;
      byDate[date] = {
        present,
        total: records.length,
        percentage: Math.round((present / records.length) * 100) || 0,
      };
    });

    return {
      totalStudents: uniqueStudents.size,
      attendance: attendancePercentage,
      byStudent,
      byDate,
    };
  };

  const stats = calculateAttendanceStats();

  return (
    <AppLayout role="teacher">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Attendance Analytics
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {userProfile?.assignedGrade
              ? `Detailed analytics for Grade ${userProfile.assignedGrade}`
              : "No grade assigned yet"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="mr-1.5 h-3.5 w-3.5" /> Logout
        </Button>
      </div>

      {!userProfile?.assignedGrade ? (
        <Card>
          <CardHeader>
            <CardTitle>No class assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Ask your admin to assign a class grade to view analytics.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Class</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Grade {userProfile.assignedGrade}</div>
                <p className="text-xs text-muted-foreground mt-1">Assigned class</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalStudents}</div>
                <p className="text-xs text-muted-foreground mt-1">In this class</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Overall Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.attendance}%</div>
                <p className="text-xs text-muted-foreground mt-1">Average attendance</p>
              </CardContent>
            </Card>
          </div>

          {attendanceRecords.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No attendance data yet</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Start taking attendance to see analytics here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance by Student</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {Object.entries(stats.byStudent)
                      .sort(([, a], [, b]) => a.percentage - b.percentage)
                      .map(([studentId, data]) => {
                        const student = attendanceRecords.find(r => r.studentId === studentId);
                        return (
                          <div
                            key={studentId}
                            className="flex items-center justify-between rounded-lg border border-border p-3"
                          >
                            <div>
                              <div className="font-medium text-sm">{student?.studentName}</div>
                              <div className="text-xs text-muted-foreground">{studentId}</div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <div className="font-semibold text-sm">{data.percentage}%</div>
                                <div className="text-xs text-muted-foreground">
                                  {data.present}/{data.total} days
                                </div>
                              </div>
                              <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${
                                  data.percentage >= 75
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {data.percentage}%
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Attendance by Date</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {Object.entries(stats.byDate)
                      .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
                      .map(([date, data]) => (
                        <div
                          key={date}
                          className="flex items-center justify-between rounded-lg border border-border p-3"
                        >
                          <div>
                            <div className="font-medium text-sm">
                              {new Date(date).toLocaleDateString("en-US", {
                                weekday: "short",
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {data.present} out of {data.total} present
                            </div>
                          </div>
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${
                              data.percentage >= 75
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {data.percentage}%
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
