import HandTracker from "@/components/HandTracker";
import BoardTracker from "@/components/BoardTracker";

export default function Home() {
  return (
    <main
      style={{
        display: "flex",
        minHeight: "100vh",
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: "40%",
          minWidth: 280,
          height: "100vh",
          maxHeight: "100vh",
          overflow: "hidden",
          borderRight: "1px solid var(--panel-line)",
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid var(--panel-line)",
          padding: "40px 24px",
        }}
      >
        <HandTracker />
      </div>
      <div
        style={{
          width: "60%",
          height: "100%",
          maxHeight: "100vh",
          overflow: "hidden",
          border: "1px solid var(--panel-line)",
          minWidth: 400,
          display: "flex",
          flexDirection: "column",
          flex: 1
        }}
      >
        <BoardTracker />
      </div>
    </main>
  );
}
