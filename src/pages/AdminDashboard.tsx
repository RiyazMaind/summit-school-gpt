import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, LogOut, Copy, Trash2, Loader2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth, type Teacher, type Student } from "@/integrations/firebase/auth-context";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const {
    userProfile,
    loading,
    logout,
    addTeacher,
    addStudent,
    getTeachers,
    getStudents,
    deleteTeacher,
    deleteStudent,
  } = useAuth();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [savingUser, setSavingUser] = useState(false);

  const [teacherName, setTeacherName] = useState("");
  const [teacherLoginId, setTeacherLoginId] = useState("");

  const [studentName, setStudentName] = useState("");
  const [studentLoginId, setStudentLoginId] = useState("");
  const [studentGrade, setStudentGrade] = useState("");

  const grades = ["1","2","3","4","5","6","7","8","9","10"];

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
    setDataLoading(true);
    try {
      const [t, s] = await Promise.all([getTeachers(), getStudents()]);
      setTeachers(t);
      setStudents(s);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setDataLoading(false);
    }
  };

  const handleAddTeacher = async () => {
    if (!teacherName || !teacherLoginId) {
      toast.error("Fill all fields");
      return;
    }

    setSavingUser(true);
    try {
      await addTeacher(teacherName, teacherLoginId);
      toast.success("Teacher added");
      setTeacherName("");
      setTeacherLoginId("");
      await loadData();
      navigate("/admin");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingUser(false);
    }
  };

  const handleAddStudent = async () => {
    if (!studentName || !studentLoginId || !studentGrade) {
      toast.error("Fill all fields");
      return;
    }

    setSavingUser(true);
    try {
      await addStudent(studentName, studentLoginId, studentGrade);
      toast.success("Student added");
      setStudentName("");
      setStudentLoginId("");
      setStudentGrade("");
      await loadData();
      navigate("/admin");
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
      {/* HEADER */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">School Admin Dashboard</h1>
          <p className="text-sm text-gray-500">
            Manage your school's teachers and students
          </p>
        </div>

        <Button onClick={handleLogout} variant="outline">
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </div>

      {/* TABS */}
      <Tabs defaultValue="teachers">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="add-teacher">Add Teacher</TabsTrigger>
          <TabsTrigger value="add-student">Add Student</TabsTrigger>
          <TabsTrigger value="teachers">Teachers ({teachers.length})</TabsTrigger>
          <TabsTrigger value="students">Students ({students.length})</TabsTrigger>
        </TabsList>

        {/* ADD TEACHER */}
        <TabsContent value="add-teacher">
          <Card>
            <CardHeader><CardTitle>Add Teacher</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Name" value={teacherName} onChange={e=>setTeacherName(e.target.value)} />
              <Input placeholder="Login ID" value={teacherLoginId} onChange={e=>setTeacherLoginId(e.target.value)} />
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
              <Input placeholder="Login ID" value={studentLoginId} onChange={e=>setStudentLoginId(e.target.value)} />

              <select value={studentGrade} onChange={e=>setStudentGrade(e.target.value)} className="w-full border p-2 rounded">
                <option value="">Select Grade</option>
                {grades.map(g=> <option key={g}>{g}</option>)}
              </select>

              <Button onClick={handleAddStudent} disabled={savingUser}>
                {savingUser ? <Loader2 className="animate-spin mr-2" /> : <Plus className="mr-2" />}
                Add Student
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TEACHERS */}
        <TabsContent value="teachers">
          {dataLoading ? (
            <p className="text-center py-6">Loading...</p>
          ) : teachers.length === 0 ? (
            <p className="text-center py-6 text-gray-500">No teachers yet</p>
          ) : (
            teachers.map((t)=>(
              <Card key={t.id} className="mb-3">
                <CardContent className="flex justify-between pt-4">
                  <div>
                    <div className="font-semibold">{t.name}</div>
                    <div className="text-sm">{t.email}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={()=>copy(t.loginId)}><Copy size={14}/></Button>
                    <Button size="sm" variant="destructive" onClick={()=>deleteTeacher(t.id!).then(loadData)}>
                      <Trash2 size={14}/>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* STUDENTS */}
        <TabsContent value="students">
          {dataLoading ? (
            <p className="text-center py-6">Loading...</p>
          ) : students.length === 0 ? (
            <p className="text-center py-6 text-gray-500">No students yet</p>
          ) : (
            students.map((s)=>(
              <Card key={s.id} className="mb-3">
                <CardContent className="flex justify-between pt-4">
                  <div>
                    <div className="font-semibold">{s.name}</div>
                    <div className="text-sm">Grade {s.grade}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={()=>copy(s.loginId)}><Copy size={14}/></Button>
                    <Button size="sm" variant="destructive" onClick={()=>deleteStudent(s.id!).then(loadData)}>
                      <Trash2 size={14}/>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}