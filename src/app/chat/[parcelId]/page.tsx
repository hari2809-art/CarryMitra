import ChatClient from "@/components/ChatClient";

export function generateStaticParams() {
  return [{ parcelId: "demo" }, { parcelId: "CM1001" }, { parcelId: "CM1002" }];
}

export default function ChatPage({ params }: { params: { parcelId: string } }) {
  return <ChatClient parcelId={params.parcelId} />;
}
