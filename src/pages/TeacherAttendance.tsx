import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, LogOut } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth, type UserProfile, type AttendanceRecord } from "@/integrations/firebase/auth-context";
import { toast } from "sonner";

const getToday = () => new Date().toISOString().slice(0, 10);

export default function TeacherAttendance() {
  const navigate = useNavigate();
  const {
    userProfile,
    logout,
    getStudentsByGrade,
    getAttendanceRecords,
    saveAttendanceRecords,
  } = useAuth();

  const [selectedDate, setSelectedDate] = useState(getToday());
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const assignedGrade = userProfile?.assignedGrade;

  const loadAttendance = async () => {
    if (!assignedGrade) {
      setStudents([]);
      setAttendance({});
      return;
    }

    setLoading(true);
    try {
      const [studentList, records] = await Promise.all([
        getStudentsByGrade(assignedGrade),
        getAttendanceRecords(assignedGrade, selectedDate),
      ]);

      setStudents(studentList);
      const attendanceMap = Object.fromEntries(
        records.map((record) => [record.studentId, record.present])
      );
      setAttendance(attendanceMap);
    } catch {
      toast.error("Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userProfile?.role === "teacher") {
      loadAttendance();
    }
  }, [userProfile?.assignedGrade, selectedDate]);

  const handleToggle = (studentId: string) => {
    setAttendance((prev) => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  const handleSave = async () => {
    if (!assignedGrade) {
      toast.error("No grade assigned to you yet.");
      return;
    }

    setSaving(true);
    try {
      const records: AttendanceRecord[] = students.map((student) => ({
        studentId: student.uid,
        studentName: student.name,
        grade: assignedGrade,
        date: selectedDate,
        present: attendance[student.uid] ?? false,
        updatedAt: new Date(),
      }));

      await saveAttendanceRecords(assignedGrade, selectedDate, records);
      toast.success("Attendance saved successfully");
      loadAttendance();
    } catch {
      toast.error("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <AppLayout role="teacher">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            {userProfile?.name ? `Attendance for ${userProfile.name}` : "Teacher Attendance"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {assignedGrade
              ? `Take attendance for Grade ${assignedGrade}`
              : "Ask your admin to assign a class grade before taking attendance."}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="mr-1.5 h-3.5 w-3.5" /> Logout
          </Button>
        </div>
      </div>

      {!assignedGrade ? (
        <Card>
          <CardHeader>
            <CardTitle>Grade not assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The admin must assign your class grade before you can take attendance.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Attendance controls</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3 sm:items-end">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Class</label>
                <div className="rounded-lg border border-border px-3 py-2 text-sm text-foreground">
                  Grade {assignedGrade}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Date</label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <div className="sm:col-span-1 flex items-center">
                <Button onClick={handleSave} disabled={saving || loading} className="w-full">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save Attendance"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Students</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading students…</p>
              ) : students.length === 0 ? (
                <p className="text-sm text-muted-foreground">No students found for this grade.</p>
              ) : (
                <div className="space-y-2">
                  {students.map((student) => (
                    <div
                      key={student.uid}
                      className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
                    >
                      <div>
                        <div className="font-medium">{student.name}</div>
                        <div className="text-sm text-muted-foreground">{student.loginId}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">Present</span>
                        <Checkbox
                          checked={attendance[student.uid] ?? false}
                          onCheckedChange={() => handleToggle(student.uid)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </AppLayout>
  );
}
