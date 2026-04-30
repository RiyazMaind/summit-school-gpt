import { useEffect, useState } from "react";
import { Plus, LogOut, Copy, Trash2, Loader2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth, type UserProfile } from "@/integrations/firebase/auth-context";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const {
    userProfile,
    loading,
    logout,
    addUser,
    getUsersByRole,
    deleteUser,
  } = useAuth();

  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [savingUser, setSavingUser] = useState(false);

  const [teacherName, setTeacherName] = useState("");
  const [teacherLoginId, setTeacherLoginId] = useState("");

  const [studentName, setStudentName] = useState("");
  const [studentLoginId, setStudentLoginId] = useState("");
  const [studentGrade, setStudentGrade] = useState("");

  // 🔐 Protect route
  useEffect(() => {
    if (!loading && (!userProfile || userProfile.role !== "admin")) {
      navigate("/login");
    }
  }, [loading, userProfile]);

  useEffect(() => {
    if (!loading && userProfile?.role === "admin") {
      loadData();
    }
  }, [loading, userProfile]);

  const loadData = async () => {
    try {
      const [t, s] = await Promise.all([
        getUsersByRole("teacher"),
        getUsersByRole("student"),
      ]);
      setTeachers(t);
      setStudents(s);
    } catch {
      toast.error("Failed to load data");
    }
  };

  // ✅ ADD TEACHER (FIXED)
  const handleAddTeacher = async () => {
    if (!teacherName || !teacherLoginId) {
      toast.error("Fill all fields");
      return;
    }

    setSavingUser(true);
    try {
      await addUser("teacher", teacherName, teacherLoginId);
      toast.success("Teacher added");
      setTeacherName("");
      setTeacherLoginId("");
      loadData();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingUser(false);
    }
  };

  // ✅ ADD STUDENT (FIXED)
  const handleAddStudent = async () => {
    if (!studentName || !studentLoginId || !studentGrade) {
      toast.error("Fill all fields");
      return;
    }

    setSavingUser(true);
    try {
      await addUser("student", studentName, studentLoginId, studentGrade);
      toast.success("Student added");
      setStudentName("");
      setStudentLoginId("");
      setStudentGrade("");
      loadData();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingUser(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  return (
    <AppLayout role="admin">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Button onClick={handleLogout}>
          <LogOut className="mr-2" /> Logout
        </Button>
      </div>

      <Tabs defaultValue="add-teacher">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="add-teacher">Add Teacher</TabsTrigger>
          <TabsTrigger value="add-student">Add Student</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
        </TabsList>

        {/* ADD TEACHER */}
        <TabsContent value="add-teacher">
          <Card>
            <CardHeader><CardTitle>Add Teacher</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Name" value={teacherName} onChange={e=>setTeacherName(e.target.value)} />
              <Input placeholder="Login ID (e.g. T01)" value={teacherLoginId} onChange={e=>setTeacherLoginId(e.target.value)} />
              <Button onClick={handleAddTeacher} disabled={savingUser}>
                {savingUser ? <Loader2 className="animate-spin mr-2" /> : <Plus className="mr-2" />}
                Add Teacher
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ADD STUDENT */}
        <TabsContent value="add-student">
          <Card>
            <CardHeader><CardTitle>Add Student</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Name" value={studentName} onChange={e=>setStudentName(e.target.value)} />
              <Input placeholder="Login ID (e.g. S01)" value={studentLoginId} onChange={e=>setStudentLoginId(e.target.value)} />
              <Input placeholder="Grade" value={studentGrade} onChange={e=>setStudentGrade(e.target.value)} />
              <Button onClick={handleAddStudent} disabled={savingUser}>
                {savingUser ? <Loader2 className="animate-spin mr-2" /> : <Plus className="mr-2" />}
                Add Student
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TEACHERS */}
        <TabsContent value="teachers">
          {teachers.map((t)=>(
            <Card key={t.uid} className="mb-3">
              <CardContent className="flex justify-between pt-4">
                <div>
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-sm">{t.email}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={()=>copy(t.loginId)}><Copy size={14}/></Button>
                  <Button size="sm" variant="destructive" onClick={()=>deleteUser(t.uid).then(loadData)}>
                    <Trash2 size={14}/>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* STUDENTS */}
        <TabsContent value="students">
          {students.map((s)=>(
            <Card key={s.uid} className="mb-3">
              <CardContent className="flex justify-between pt-4">
                <div>
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-sm">Grade {s.grade}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={()=>copy(s.loginId)}><Copy size={14}/></Button>
                  <Button size="sm" variant="destructive" onClick={()=>deleteUser(s.uid).then(loadData)}>
                    <Trash2 size={14}/>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

      </Tabs>
    </AppLayout>
  );
}