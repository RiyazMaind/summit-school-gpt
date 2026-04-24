import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, ChevronRight, Search, Sparkles, LogOut } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { classes, subjects, chapters } from "@/data/mockData";
import PasswordUpdateDialog from "@/components/PasswordUpdateDialog";
import { useAuth } from "@/integrations/firebase/auth-context";
import { toast } from "sonner";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { userProfile, logout } = useAuth();
  const [selectedClass, setSelectedClass] = useState<number>(10);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (userProfile?.grade) {
      const gradeNum = Number(userProfile.grade);
      if (!Number.isNaN(gradeNum)) {
        setSelectedClass(gradeNum);
      }
    }
  }, [userProfile?.grade]);

  const currentSubjects = subjects[selectedClass] || [];
  const currentChapters = selectedSubject ? chapters[selectedSubject] || [] : [];

  const filteredChapters = currentChapters.filter(
    (ch) =>
      ch.name.toLowerCase().includes(search.toLowerCase()) ||
      ch.topics.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

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
    <AppLayout role="student">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Welcome back{userProfile?.name ? `, ${userProfile.name}` : ''}! 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {userProfile?.grade
              ? `Grade ${userProfile.grade} student dashboard.`
              : 'Select your class and subject to start exploring topics.'}
          </p>
          {userProfile?.loginId ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Your login ID is <span className="font-mono text-foreground">{userProfile.loginId}</span>
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

      {/* Class Selector */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-foreground">Class</label>
        <div className="flex flex-wrap gap-2">
          {classes.map((cls) => (
            <button
              key={cls.id}
              onClick={() => {
                setSelectedClass(cls.id);
                setSelectedSubject(null);
              }}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
                selectedClass === cls.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cls.id}
            </button>
          ))}
        </div>
      </div>

      {/* Subject Grid */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-foreground">Subject</label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {currentSubjects.map((subj, i) => (
            <motion.button
              key={subj.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedSubject(subj.id)}
              className={`topic-card text-left ${
                selectedSubject === subj.id ? "!border-secondary ring-1 ring-secondary/30" : ""
              }`}
            >
              <span className="text-2xl">{subj.icon}</span>
              <div className="mt-2 text-sm font-semibold text-foreground">{subj.name}</div>
              <div className="text-xs text-muted-foreground">{subj.chapters} chapters</div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Chapters & Topics */}
      {selectedSubject && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="mb-4 flex items-center gap-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Chapters</h2>
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9 h-9"
                placeholder="Search topics..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {filteredChapters.map((ch, i) => (
              <motion.div
                key={ch.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="topic-card"
              >
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="font-display text-sm font-semibold text-foreground">{ch.name}</h3>
                  <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ch.topics.map((topic) => (
                    <button
                      key={topic}
                      onClick={() =>
                        navigate(`/student/topic?subject=${selectedSubject}&chapter=${ch.id}&topic=${encodeURIComponent(topic)}`)
                      }
                      className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/10 hover:text-secondary"
                    >
                      <Sparkles className="h-3 w-3" />
                      {topic}
                    </button>
                  ))}
                </div>
              </motion.div>
            ))}

            {filteredChapters.length === 0 && (
              <p className="col-span-2 py-8 text-center text-sm text-muted-foreground">
                No chapters found. Try a different search.
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Quick prompts */}
      {!selectedSubject && (
        <div className="mt-4 rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 font-display text-sm font-semibold text-foreground">
            💡 Try asking
          </h3>
          <div className="flex flex-wrap gap-2">
            {[
              "Explain Pythagoras theorem simply",
              "What are chemical reactions?",
              "How does photosynthesis work?",
              "Explain quadratic formula",
            ].map((prompt) => (
              <button
                key={prompt}
                className="rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-secondary hover:text-secondary"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
