import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Loader2 } from "lucide-react";
import { generateTeachingContent } from "@/lib/ai.functions";

const inputClass = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
const KINDS = ["Lesson Plan", "Quiz", "Project Brief", "Activity Sheet"];
const GRADES = ["Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10"];
const SUBJECTS = ["Science", "Maths", "Robotics", "Coding", "AI", "STEM"];

export function AiSection() {
  const [kind, setKind] = useState(KINDS[0]!);
  const [grade, setGrade] = useState(GRADES[2]!);
  const [subject, setSubject] = useState(SUBJECTS[0]!);
  const [topic, setTopic] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const generateFn = useServerFn(generateTeachingContent);
  const generate = useMutation({
    mutationFn: generateFn,
    onSuccess: (res) => {
      setOutput(res.text);
      setError(res.error);
    },
    onError: () => setError("Could not reach the AI service."),
  });

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-primary/25 bg-card p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary">
            <Sparkles className="h-5 w-5 text-primary" />
          </span>
          <div>
            <h2 className="text-xl font-bold">Kaleidonex AI</h2>
            <p className="text-sm text-muted-foreground">
              Generate lesson plans, quizzes and project briefs for your classes in seconds.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-primary/25 bg-card p-5">
        <form
          className="grid gap-3 md:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            setOutput("");
            generate.mutate({ data: { kind, grade, subject, topic } });
          }}
        >
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Type</span>
            <select value={kind} onChange={(e) => setKind(e.target.value)} className={inputClass}>
              {KINDS.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Grade</span>
            <select value={grade} onChange={(e) => setGrade(e.target.value)} className={inputClass}>
              {GRADES.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Subject</span>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={inputClass}
            >
              {SUBJECTS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Topic</span>
            <input
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Photosynthesis"
              className={inputClass}
            />
          </label>
          <div className="md:col-span-4">
            <button
              type="submit"
              disabled={generate.isPending}
              className="flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {generate.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Generate
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {(output || error) && (
        <section className="rounded-xl border border-primary/25 bg-card p-5">
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Result
          </h3>
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <pre className="whitespace-pre-wrap text-sm leading-relaxed">{output}</pre>
          )}
        </section>
      )}
    </div>
  );
}
