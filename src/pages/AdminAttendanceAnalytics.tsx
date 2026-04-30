import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, BarChart3 } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth, type AttendanceRecord, type UserProfile } from "@/integrations/firebase/auth-context";
import { toast } from "sonner";

interface GradeStats {
  grade: string;
  totalStudents: number;
  totalRecords: number;
  presentCount: number;
  attendancePercent: number;
}

export default function AdminAttendanceAnalytics() {
  const navigate = useNavigate();
  const { userProfile, logout, getUsersByRole, getAllAttendanceRecords } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [studentsData, attendanceData] = await Promise.all([
          getUsersByRole("student"),
          getAllAttendanceRecords(),
        ]);
        setStudents(studentsData);
        setAttendanceRecords(attendanceData);
      } catch {
        toast.error("Failed to load school attendance analytics");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [getAllAttendanceRecords, getUsersByRole]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const gradeStats = () => {
    const grades = Array.from(new Set(students.map((student) => student.grade?.toString() || "Unknown")));

    return grades.map((grade) => {
      const gradeStudents = students.filter((student) => student.grade?.toString() === grade);
      const gradeAttendance = attendanceRecords.filter((record) => record.grade === grade);
      const presentCount = gradeAttendance.filter((record) => record.present).length;
      const totalRecords = gradeAttendance.length;
      const percent = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

      return {
        grade,
        totalStudents: gradeStudents.length,
        totalRecords,
        presentCount,
        attendancePercent: percent,
      };
    }).sort((a, b) => Number(a.grade) - Number(b.grade));
  };

  const stats = gradeStats();

  return (
    <AppLayout role="admin">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">School Attendance Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Grade-wise attendance summary for the whole school.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="mr-1.5 h-3.5 w-3.5" /> Logout
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{students.length}</div>
            <p className="text-sm text-muted-foreground mt-1">All registered students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Attendance Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{attendanceRecords.length}</div>
            <p className="text-sm text-muted-foreground mt-1">Saved attendance entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tracked Grades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.length}</div>
            <p className="text-sm text-muted-foreground mt-1">Grades with student data</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Grade Attendance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading analytics…</p>
            ) : stats.length === 0 ? (
              <p className="text-sm text-muted-foreground">No attendance data available yet.</p>
            ) : (
              <div className="space-y-3">
                {stats.map((gradeStat) => (
                  <div key={gradeStat.grade} className="rounded-lg border border-border p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-sm font-semibold">Grade {gradeStat.grade}</div>
                        <div className="text-xs text-muted-foreground">
                          {gradeStat.totalStudents} students • {gradeStat.totalRecords} attendance entries
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-2xl font-bold">{gradeStat.attendancePercent}%</div>
                        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {gradeStat.presentCount} present
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
