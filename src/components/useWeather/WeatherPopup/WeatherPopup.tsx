import { Air, LocationOn, Thermostat, Water } from "@mui/icons-material";
import { Alert, Box, Card, CardContent, Chip, LinearProgress, Popover, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { fetchLocationName } from "../../MapUtils";
import type { DailyForecast } from "../useWeatherForecast";

interface WeatherPopupProps {
  open: boolean;
  onClose: () => void;
  daily: DailyForecast | null;
  loading?: boolean;
  error?: string | null;
  position?: { lng: number; lat: number } | null;
  anchorEl?: Element | null;
}


export const WeatherPopup: React.FC<WeatherPopupProps> = ({
  open,
  onClose,
  daily,
  loading = false,
  error = null,
  position,
  anchorEl,
}) => {
  const [locationInfo, setLocationInfo] = useState<null |string>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  useEffect(() => {
    if (!position || !open) {
      setLocationInfo(null);
      return;
    }

    const fetchAndSetLocation = async () => {
      setLoadingLocation(true);
      try {
        const locationData : string | null= await fetchLocationName(position.lat, position.lng);
        setLocationInfo(locationData);
      } catch (error) {
        console.error("Error fetching location:", error);
        setLocationInfo(null);
      } finally {
        setLoadingLocation(false);
      }
    };

    fetchAndSetLocation();
  }, [position, open]);



  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("he-IL", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    });
  };

  const getTemperatureColor = (temp: number) => {
    if (temp > 30) return "#f44336";
    if (temp > 20) return "#ff9800";
    return "#2196f3";
  };

  if (loading) {
    return (
      <Popover
        open={open}
        onClose={onClose}
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{
          "& .MuiPopover-paper": { borderRadius: 2, boxShadow: 3, minWidth: 200, maxWidth: 300 },
        }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="primary" align="center" gutterBottom>
            טוען תחזית...
          </Typography>
          <LinearProgress sx={{ width: "100%" }} />
        </Box>
      </Popover>
    );
  }

  if (error) {
    return (
      <Popover
        open={open}
        onClose={onClose}
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{
          "& .MuiPopover-paper": { borderRadius: 2, boxShadow: 3, minWidth: 200, maxWidth: 300 },
        }}>
        <Box sx={{ p: 2 }}>
          <Alert severity="error" sx={{ mb: 1 }}>
            <Typography variant="body2" fontWeight="bold">
              שגיאה
            </Typography>
            <Typography variant="caption">{error}</Typography>
          </Alert>
        </Box>
      </Popover>
    );
  }

  if (!daily) {
    return (
      <Popover
        open={open}
        onClose={onClose}
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{
          "& .MuiPopover-paper": { borderRadius: 2, boxShadow: 3, minWidth: 200, maxWidth: 300 },
        }}>
        <Box sx={{ p: 2, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            אין נתונים זמינים
          </Typography>
        </Box>
      </Popover>
    );
  }

  return (
    <Popover
      open={open}
      onClose={onClose}
      anchorEl={anchorEl}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      transformOrigin={{ vertical: "bottom", horizontal: "center" }}
      sx={{
        "& .MuiPopover-paper": {
          borderRadius: 2,
          boxShadow: 3,
          minWidth: 280,
          maxWidth: 350,
          maxHeight: 450,
          overflow: "hidden",
          background: "linear-gradient(135deg, #1976d2, #42a5f5)",
        },
      }}>
      <Box sx={{ p: 1.5, color: "white" }}>
        <Typography variant="subtitle1" fontWeight="bold" align="center" gutterBottom>
          תחזית 7 ימים
        </Typography>

        {position && (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
            {loadingLocation ? (
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                🗺️ טוען מיקום...
              </Typography>
            ) : locationInfo ? (
              <Chip
                icon={<LocationOn sx={{ fontSize: 14 }} />}
                label={locationInfo}
                size="small"
                sx={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "0.7rem",
                  height: 24,
                  "& .MuiChip-icon": { color: "white", fontSize: 14 },
                }}
              />
            ) : (
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                🗺️ {position.lat.toFixed(2)}, {position.lng.toFixed(2)}
              </Typography>
            )}
          </Box>
        )}
      </Box>

      <Box sx={{ bgcolor: "white", p: 1, maxHeight: 300, overflowY: "hidden" }}>
        {daily.time.slice(0, 7).map((time: string, index: number) => (
          <Card key={time} sx={{ mb: 1, borderRadius: 1.5, boxShadow: 1, "&:last-child": { mb: 0 } }}>
            <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
              <Box display="grid" gridTemplateColumns="70px 1fr auto auto" gap={1} alignItems="center">
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: "bold",
                    color: "text.primary",
                    textAlign: "right",
                    fontSize: "0.7rem",
                  }}>
                  {formatDate(time)}
                </Typography>

                <Box display="flex" alignItems="center" gap={0.5}>
                  <Thermostat
                    sx={{
                      fontSize: 16,
                      color: getTemperatureColor(daily.temperature_2m_max[index]),
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: getTemperatureColor(daily.temperature_2m_max[index]),
                      fontWeight: "bold",
                      fontSize: "0.7rem",
                    }}>
                    {Math.round(daily.temperature_2m_min[index])}° / {Math.round(daily.temperature_2m_max[index])}°
                  </Typography>
                </Box>

                <Box display="flex" alignItems="center" gap={0.5}>
                  <Water sx={{ fontSize: 14, color: "#1976d2" }} />
                  <Typography variant="caption" color="primary" fontWeight="bold" fontSize="0.65rem">
                    {daily.precipitation_probability_max?.[index] != null
                      ? `${daily.precipitation_probability_max[index]}%`
                      : "—"}
                  </Typography>
                </Box>

                <Box display="flex" alignItems="center" gap={0.5}>
                  <Air sx={{ fontSize: 14, color: "#7b1fa2" }} />
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#7b1fa2",
                      fontWeight: "bold",
                      fontSize: "0.65rem",
                    }}>
                    {daily.wind_speed_10m_max?.[index] != null ? `${Math.round(daily.wind_speed_10m_max[index])}` : "—"}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box sx={{ bgcolor: "rgba(255,255,255,0.1)", py: 0.5, px: 1, textAlign: "center" }}>
        <Typography variant="caption" sx={{ color: "white", opacity: 0.8, fontSize: "0.6rem" }}>
          ⚡ OpenMeteo
        </Typography>
      </Box>
    </Popover>
  );
};
