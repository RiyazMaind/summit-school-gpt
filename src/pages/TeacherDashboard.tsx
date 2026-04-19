import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Edit, Eye, Check, Plus, Trash2, Sparkles, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { classes, subjects, chapters, mockQuizQuestions } from "@/data/mockData";
import PasswordUpdateDialog from "@/components/PasswordUpdateDialog";
import { useAuth } from "@/integrations/firebase/auth-context";
import { toast } from "sonner";

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { userProfile, logout } = useAuth();
  const [selectedClass, setSelectedClass] = useState(10);
  const [selectedSubject, setSelectedSubject] = useState<string | null>("math-10");
  const [quizType, setQuizType] = useState<"mcq" | "short" | "mixed">("mixed");
  const [questionCount, setQuestionCount] = useState(5);
  const [generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState(mockQuizQuestions);
  const [editingId, setEditingId] = useState<number | null>(null);

  const currentSubjects = subjects[selectedClass] || [];
  const currentChapters = selectedSubject ? chapters[selectedSubject] || [] : [];
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);

  const toggleChapter = (id: string) => {
    setSelectedChapters((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerated(true);
      setGenerating(false);
    }, 1500);
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

  return (
    <AppLayout role="teacher">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            {userProfile?.name ? `Hello, ${userProfile.name}` : 'Teacher Dashboard'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {userProfile?.loginId
              ? `Your login ID is ${userProfile.loginId}`
              : 'Create curriculum-aligned assessments from NCERT content'}
          </p>
          {userProfile?.role === 'teacher' ? (
            <p className="mt-2 text-sm text-muted-foreground">
              This is your personalized teacher screen.
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <PasswordUpdateDialog />
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="mr-1.5 h-3.5 w-3.5" /> Logout
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Configuration */}
        <div className="lg:col-span-1">
          <div className="glass-card space-y-4 p-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Class</label>
              <div className="flex flex-wrap gap-1.5">
                {[1,2,3,4,5,6,7,8,9,10].map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setSelectedClass(c);
                      setSelectedSubject(null);
                      setSelectedChapters([]);
                      setGenerated(false);
                    }}
                    className={`rounded-full px-3 py-1 text-sm font-medium transition-all ${
                      selectedClass === c
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Subject</label>
              <div className="space-y-1.5">
                {currentSubjects.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedSubject(s.id);
                      setSelectedChapters([]);
                      setGenerated(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all ${
                      selectedSubject === s.id
                        ? "bg-secondary/10 text-secondary font-medium"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <span>{s.icon}</span>
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            {currentChapters.length > 0 && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Chapters</label>
                <div className="max-h-48 space-y-1 overflow-y-auto">
                  {currentChapters.map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => toggleChapter(ch.id)}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition-all ${
                        selectedChapters.includes(ch.id)
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        selectedChapters.includes(ch.id) ? "border-primary bg-primary" : "border-border"
                      }`}>
                        {selectedChapters.includes(ch.id) && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      {ch.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Question Type</label>
              <div className="flex gap-1.5">
                {(["mcq", "short", "mixed"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setQuizType(t)}
                    className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-all ${
                      quizType === t
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Questions: {questionCount}
              </label>
              <input
                type="range"
                min={3}
                max={20}
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generating || selectedChapters.length === 0}
              className="w-full"
            >
              <Sparkles className="mr-1.5 h-4 w-4" />
              {generating ? "Generating..." : "Generate Quiz"}
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-2">
          {!generated ? (
            <div className="flex h-64 items-center justify-center rounded-xl border-2 border-dashed border-border">
              <div className="text-center">
                <FileText className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  Configure your quiz and click generate
                </p>
              </div>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-foreground">
                  Generated Quiz
                </h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="mr-1.5 h-3.5 w-3.5" /> Export PDF
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {questions.map((q, i) => (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-card p-4"
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {i + 1}
                        </span>
                        <div>
                          <span className="mb-1 inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                            {q.type}
                          </span>
                          <p className="text-sm font-medium text-foreground">{q.question}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {q.type === "mcq" && q.options && (
                      <div className="ml-8 grid grid-cols-2 gap-1.5">
                        {q.options.map((opt, oi) => (
                          <div
                            key={oi}
                            className={`rounded-md px-3 py-1.5 text-xs ${
                              oi === q.answer
                                ? "bg-success/10 font-medium text-success"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {String.fromCharCode(65 + oi)}. {opt}
                          </div>
                        ))}
                      </div>
                    )}

                    {q.type === "short" && typeof q.answer === "string" && (
                      <div className="ml-8 mt-1 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                        <strong>Expected:</strong> {q.answer}
                      </div>
                    )}

                    <p className="ml-8 mt-1.5 text-[10px] text-muted-foreground">{q.chapter}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
