import { useState, useEffect, useRef, DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Presentation, Upload, ChevronLeft, ChevronRight, Trash2, FileText, Image, File } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface SlideFile {
  id: string;
  file_name: string;
  file_url: string;
}

interface SlideSession {
  current_slide_url: string | null;
  is_active: boolean;
}

const IMAGE_EXTS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp"];
const isImage = (name: string) => IMAGE_EXTS.some(ext => name.toLowerCase().endsWith(ext));

function FileIcon({ name }: { name: string }) {
  if (isImage(name)) return <Image className="h-6 w-6 text-primary" />;
  if (name.toLowerCase().endsWith(".pdf")) return <FileText className="h-6 w-6 text-destructive" />;
  return <File className="h-6 w-6 text-muted-foreground" />;
}

export function SlideUploadButton({ classId }: { classId: string }) {
  const [slides, setSlides] = useState<SlideFile[]>([]);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSlides = async () => {
    const { data } = await supabase
      .from("class_slides")
      .select("*")
      .eq("class_id", classId)
      .order("created_at");
    setSlides((data as SlideFile[]) || []);
  };

  useEffect(() => { fetchSlides(); }, [classId]);

  const uploadFiles = async (files: FileList | File[]) => {
    if (!user) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      const path = `${classId}/${Date.now()}-${file.name}`;
      const { error: uploadErr } = await supabase.storage.from("slides").upload(path, file);
      if (uploadErr) {
        toast({ title: "Upload failed", description: uploadErr.message, variant: "destructive" });
        continue;
      }
      const { data: urlData } = supabase.storage.from("slides").getPublicUrl(path);
      await supabase.from("class_slides").insert({
        class_id: classId,
        file_name: file.name,
        file_url: urlData.publicUrl,
        uploaded_by: user.id,
      });
    }

    await fetchSlides();
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) uploadFiles(e.target.files);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: DragEvent) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = (e: DragEvent) => { e.preventDefault(); setDragging(false); };

  const handleDelete = async (slide: SlideFile) => {
    await supabase.from("class_slides").delete().eq("id", slide.id);
    await fetchSlides();
  };

  const startPresenting = async () => {
    if (slides.length === 0) return;
    setPresenting(true);
    setCurrentIdx(0);
    const { data: existing } = await supabase
      .from("slide_sessions")
      .select("id")
      .eq("class_id", classId)
      .maybeSingle();

    if (existing) {
      await supabase.from("slide_sessions").update({
        current_slide_url: slides[0].file_url,
        is_active: true,
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("class_id", classId);
    } else {
      await supabase.from("slide_sessions").insert({
        class_id: classId,
        current_slide_url: slides[0].file_url,
        is_active: true,
        started_at: new Date().toISOString(),
      });
    }
  };

  const stopPresenting = async () => {
    setPresenting(false);
    await supabase.from("slide_sessions").update({
      is_active: false,
      current_slide_url: null,
      updated_at: new Date().toISOString(),
    }).eq("class_id", classId);
  };

  const goToSlide = async (idx: number) => {
    if (idx < 0 || idx >= slides.length) return;
    setCurrentIdx(idx);
    await supabase.from("slide_sessions").update({
      current_slide_url: slides[idx].file_url,
      updated_at: new Date().toISOString(),
    }).eq("class_id", classId);
  };

  const renderPreview = (slide: SlideFile) => {
    if (isImage(slide.file_name)) {
      return <img src={slide.file_url} alt={slide.file_name} className="max-h-full max-w-full object-contain" />;
    }
    if (slide.file_name.toLowerCase().endsWith(".pdf")) {
      return (
        <iframe
          src={`https://docs.google.com/gview?url=${encodeURIComponent(slide.file_url)}&embedded=true`}
          className="w-full h-full"
          title={slide.file_name}
        />
      );
    }
    // For DOCX and other non-previewable files, use Google Docs viewer
    return (
      <iframe
        src={`https://docs.google.com/gview?url=${encodeURIComponent(slide.file_url)}&embedded=true`}
        className="w-full h-full"
        title={slide.file_name}
      />
    );
  };

  const renderThumbnail = (slide: SlideFile) => {
    if (isImage(slide.file_name)) {
      return <img src={slide.file_url} alt={slide.file_name} className="w-full aspect-video object-cover" />;
    }
    return (
      <div className="w-full aspect-video flex flex-col items-center justify-center bg-muted/50 gap-1 p-2">
        <FileIcon name={slide.file_name} />
        <span className="text-[10px] text-muted-foreground text-center truncate w-full">{slide.file_name}</span>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl gap-2">
          <Presentation className="h-4 w-4" /> Slides
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Slides & Documents</DialogTitle>
        </DialogHeader>

        <input
          ref={fileRef}
          type="file"
          accept="*/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Drag & drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
            dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
          }`}
          onClick={() => fileRef.current?.click()}
        >
          <Upload className={`h-8 w-8 mx-auto mb-2 ${dragging ? "text-primary" : "text-muted-foreground"}`} />
          <p className="text-sm font-medium text-foreground">
            {uploading ? "Uploading..." : "Drag & drop files here"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PDF, DOCX, PNG, JPG, and more — or click to browse
          </p>
        </div>

        <div className="flex gap-2">
          {slides.length > 0 && !presenting && (
            <Button className="rounded-xl gap-2" onClick={startPresenting}>
              <Presentation className="h-4 w-4" /> Start Presenting
            </Button>
          )}
          {presenting && (
            <Button variant="destructive" className="rounded-xl" onClick={stopPresenting}>
              Stop Presenting
            </Button>
          )}
        </div>

        {presenting && slides.length > 0 && (
          <div className="space-y-3">
            <div className="relative bg-muted rounded-xl overflow-hidden aspect-video flex items-center justify-center">
              {renderPreview(slides[currentIdx])}
            </div>
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" size="icon" className="rounded-xl" onClick={() => goToSlide(currentIdx - 1)} disabled={currentIdx === 0}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">{currentIdx + 1} / {slides.length}</span>
              <Button variant="outline" size="icon" className="rounded-xl" onClick={() => goToSlide(currentIdx + 1)} disabled={currentIdx === slides.length - 1}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {!presenting && slides.length > 0 && (
          <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
            {slides.map((s, i) => (
              <div key={s.id} className="relative group rounded-xl border border-border overflow-hidden">
                {renderThumbnail(s)}
                <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => handleDelete(s)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <span className="absolute bottom-1 left-1 text-[10px] bg-background/80 rounded px-1">{i + 1}</span>
              </div>
            ))}
          </div>
        )}

        {slides.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">No files uploaded yet.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function StudentSlideViewer({ classId }: { classId: string }) {
  const [session, setSession] = useState<SlideSession | null>(null);
  const [fileName, setFileName] = useState<string>("");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("slide_sessions")
        .select("current_slide_url, is_active")
        .eq("class_id", classId)
        .maybeSingle();
      setSession(data as SlideSession | null);
    };
    fetch();

    const channel = supabase
      .channel(`slides-${classId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "slide_sessions",
        filter: `class_id=eq.${classId}`,
      }, (payload) => {
        const newData = payload.new as any;
        setSession({ current_slide_url: newData.current_slide_url, is_active: newData.is_active });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [classId]);

  if (!session?.is_active || !session.current_slide_url) return null;

  const url = session.current_slide_url;
  const isImg = IMAGE_EXTS.some(ext => url.toLowerCase().endsWith(ext));
  const isPdf = url.toLowerCase().endsWith(".pdf");

  const renderContent = () => {
    if (isImg) {
      return <img src={url} alt="Current slide" className="max-h-full max-w-full object-contain" />;
    }
    if (isPdf) {
      return (
        <iframe
          src={`https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`}
          className="w-full h-full"
          title="Slide"
        />
      );
    }
    return (
      <iframe
        src={`https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`}
        className="w-full h-full"
        title="Slide"
      />
    );
  };

  return (
    <div className="border-b border-border bg-muted/30 px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <Presentation className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Live Slides</span>
        <span className="text-[10px] bg-primary/15 text-primary rounded-full px-2 py-0.5 animate-pulse">LIVE</span>
      </div>
      <div className="rounded-xl overflow-hidden bg-background border border-border aspect-video max-h-72 flex items-center justify-center">
        {renderContent()}
      </div>
    </div>
  );
}
