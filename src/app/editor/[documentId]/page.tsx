import { CollaborativeEditor } from "@/components/editor/collaborative-editor";

interface EditorPageProps {
  params: Promise<{ documentId: string }>;
}

export default async function EditorPage({ params }: EditorPageProps) {
  const resolvedParams = await params;
  const documentId = resolvedParams.documentId || "default";

  return <CollaborativeEditor documentId={documentId} />;
}
