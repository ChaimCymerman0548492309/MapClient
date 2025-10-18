
// PolygonButton.tsx
import { Button } from "@mui/material";
import { Alert } from "@mui/material";

interface StatusAlertProps {
  type: "saving" | "success" | "error" | "info" | "warning";
  message: string;
}

interface PolygonButtonProps {
  mode: "draw" | "edit" | "delete" | "save";
  isActive?: boolean;
  disabled?: boolean;
  count?: number;
  onClick: () => void;
}

 export const PolygonButton = ({ mode, isActive, disabled, count, onClick }: PolygonButtonProps) => {
  const config = {
    draw: { label: "Draw Mode", activeLabel: "Stop Draw Mode", color: "warning" as const },
    edit: { label: "Edit Mode", activeLabel: "Stop Edit Mode", color: "warning" as const },
    delete: { label: "Delete Mode", activeLabel: "Cancel Delete Mode", color: "error" as const },
    save: { label: `Save (${count})`, activeLabel: `Save (${count})`, color: "success" as const }
  }[mode];

  return (
    <Button
      variant={isActive ? "contained" : mode === "save" ? "contained" : "outlined"}
      color={config.color}
      size="small"
      onClick={onClick}
      disabled={disabled}
      className="pp-btn"
    >
      {isActive ? config.activeLabel : config.label}
    </Button>
  );
};





export const StatusAlert = ({ type, message }: StatusAlertProps) => {
  const severity = {
    saving: "info",
    success: "success", 
    error: "error",
    info: "info",
    warning: "warning"
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }[type] as any;

  return <Alert severity={severity} className="pp-alert">{message}</Alert>;
};