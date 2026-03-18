import TrackingClient from "@/components/TrackingClient";

export function generateStaticParams() {
  return [{ parcelId: "demo" }, { parcelId: "CM1001" }, { parcelId: "CM1002" }];
}

export default function TrackingPage({ params }: { params: { parcelId: string } }) {
  return <TrackingClient parcelId={params.parcelId} />;
}
