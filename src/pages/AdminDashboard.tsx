import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Plus, LogOut, Eye, EyeOff, Copy, Trash2, Lock, Shield } from "lucide-react";
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
  const { userProfile, loading, logout, addTeacher, addStudent, getTeachers, getStudents, deleteTeacher, deleteStudent } = useAuth();
  
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  
  // Teacher form state
  const [teacherName, setTeacherName] = useState("");
  const [teacherLoginId, setTeacherLoginId] = useState("");
  
  // Student form state
  const [studentName, setStudentName] = useState("");
  const [studentLoginId, setStudentLoginId] = useState("");
  const [studentGrade, setStudentGrade] = useState("");
  
  // Redirect if not admin
  useEffect(() => {
    if (!loading && !savingUser && (!userProfile || userProfile.role !== "admin")) {
      navigate("/login");
    }
  }, [loading, userProfile, navigate, savingUser]);

  useEffect(() => {
    if (!loading && userProfile?.role === "admin") {
      loadData();
    }
  }, [loading, userProfile]);

  const loadData = async () => {
    setDataLoading(true);
    try {
      const [teachersData, studentsData] = await Promise.all([
        getTeachers(),
        getStudents(),
      ]);
      setTeachers(teachersData);
      setStudents(studentsData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setDataLoading(false);
    }
  };

  const handleAddTeacher = async () => {
    if (!teacherName || !teacherLoginId) {
      toast.error("Please fill in all fields");
      return;
    }

    setSavingUser(true);
    try {
      await addTeacher(teacherName, teacherLoginId);
      toast.success(`Teacher added! Login ID: ${teacherLoginId}, Password: ${teacherLoginId}`);
      setTeacherName("");
      setTeacherLoginId("");
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to add teacher");
    } finally {
      setSavingUser(false);
    }
  };

  const handleAddStudent = async () => {
    if (!studentName || !studentLoginId || !studentGrade) {
      toast.error("Please fill in all fields");
      return;
    }

    setSavingUser(true);
    try {
      await addStudent(studentName, studentLoginId, studentGrade);
      toast.success(`Student added! Login ID: ${studentLoginId}, Password: ${studentLoginId}`);
      setStudentName("");
      setStudentLoginId("");
      setStudentGrade("");
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to add student");
    } finally {
      setSavingUser(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const grades = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

  return (
    <AppLayout role="admin">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage teachers and students
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="mr-1.5 h-3.5 w-3.5" /> Logout
        </Button>
      </div>

      <Tabs defaultValue="add-teacher" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="add-teacher">Add Teacher</TabsTrigger>
          <TabsTrigger value="add-student">Add Student</TabsTrigger>
          <TabsTrigger value="teachers">Teachers ({teachers.length})</TabsTrigger>
          <TabsTrigger value="students">Students ({students.length})</TabsTrigger>
        </TabsList>

        {/* Add Teacher */}
        <TabsContent value="add-teacher" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Add New Teacher
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Teacher Name</label>
                <Input
                  placeholder="e.g., John Smith"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Login ID or Email</label>
                <Input
                  placeholder="e.g., john.smith or john@example.com"
                  value={teacherLoginId}
                  onChange={(e) => setTeacherLoginId(e.target.value)}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  This can be a simple username or an email, and it will also be the initial password.
                </p>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  <strong>Note:</strong> Initial password will be same as login ID. Teacher can change password after first login.
                </p>
              </div>

              <Button onClick={handleAddTeacher} className="w-full" size="lg">
                <Plus className="mr-2 h-4 w-4" /> Add Teacher
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Add Student */}
        <TabsContent value="add-student" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Add New Student
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Student Name</label>
                <Input
                  placeholder="e.g., Rahul Kumar"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Login ID or Email</label>
                <Input
                  placeholder="e.g., rahul.kumar or rahul@example.com"
                  value={studentLoginId}
                  onChange={(e) => setStudentLoginId(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddStudent()}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  This can be a simple username or an email, and it will also be the initial password.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Grade</label>
                <select
                  value={studentGrade}
                  onChange={(e) => setStudentGrade(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select Grade</option>
                  {grades.map((grade) => (
                    <option key={grade} value={grade}>
                      Grade {grade}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  <strong>Note:</strong> Initial password will be same as login ID. Student can change password after first login.
                </p>
              </div>

              <Button onClick={handleAddStudent} className="w-full" size="lg">
                <Plus className="mr-2 h-4 w-4" /> Add Student
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teachers List */}
        <TabsContent value="teachers" className="mt-6">
          {dataLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : teachers.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No teachers added yet
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {teachers.map((teacher, index) => (
                <motion.div
                  key={teacher.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-foreground">{teacher.name}</div>
                          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                            <div>
                              Login ID:{" "}
                              <span className="font-mono font-medium text-foreground">{teacher.loginId}</span>
                            </div>
                            <div>
                              Email:{" "}
                              <span className="font-mono font-medium text-foreground">{teacher.email}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(teacher.loginId)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (confirm(`Delete ${teacher.name}?`)) {
                                deleteTeacher(teacher.id!).then(() => {
                                  toast.success("Teacher deleted");
                                  loadData();
                                });
                              }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Students List */}
        <TabsContent value="students" className="mt-6">
          {dataLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : students.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No students added yet
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {students.map((student, index) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-foreground">{student.name}</div>
                          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                            <div>
                              Login ID:{" "}
                              <span className="font-mono font-medium text-foreground">{student.loginId}</span>
                            </div>
                            <div>
                              Grade: <span className="font-medium text-foreground">{student.grade}</span>
                            </div>
                            <div>
                              Email:{" "}
                              <span className="font-mono font-medium text-foreground">{student.email}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(student.loginId)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (confirm(`Delete ${student.name}?`)) {
                                deleteStudent(student.id!).then(() => {
                                  toast.success("Student deleted");
                                  loadData();
                                });
                              }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
