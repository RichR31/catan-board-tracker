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
          display: "flex",
          flexDirection: "column",
          paddingLeft: 16,
          paddingRight: 16,
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
          minWidth: 400,
          display: "flex",
          flexDirection: "column",
          flex: 1,
          padding: 0
        }}
      >
        <BoardTracker />
      </div>
    </main>
  );
}
