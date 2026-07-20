"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Faq } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function FaqManager({ faqs }: { faqs: Faq[] }) {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch("/api/admin/faq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, answer, sortOrder: faqs.length, active: true }),
    });
    setSubmitting(false);
    setQuestion("");
    setAnswer("");
    router.refresh();
  }

  async function remove(id: string) {
    setPendingId(id);
    await fetch(`/api/admin/faq/${id}`, { method: "DELETE" });
    setPendingId(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="space-y-2 border-b pb-4">
        <div className="space-y-1">
          <Label htmlFor="faqQuestion">Question</Label>
          <Input id="faqQuestion" value={question} onChange={(e) => setQuestion(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="faqAnswer">Answer</Label>
          <Textarea id="faqAnswer" value={answer} onChange={(e) => setAnswer(e.target.value)} rows={2} required />
        </div>
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? "Adding..." : "Add FAQ"}
        </Button>
      </form>

      <div className="space-y-2">
        {faqs.map((faq) => (
          <div key={faq.id} className="flex items-start justify-between gap-3 border-b pb-2 text-sm">
            <div>
              <p className="font-medium">{faq.question}</p>
              <p className="text-muted-foreground">{faq.answer}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => remove(faq.id)}
              disabled={pendingId === faq.id}
            >
              Delete
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
