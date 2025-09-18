import { Button, Stack, Typography } from "@mui/material";

const ObjectsPanel = () => {
  return (
    <div>
      <Typography variant="h6" gutterBottom>
        Objects Management
      </Typography>
      <Stack direction="row" spacing={2}>
        <Button variant="contained" color="primary">Add</Button>
        <Button variant="outlined" color="success">Save</Button>
        <Button variant="outlined" color="error">Delete</Button>
      </Stack>
    </div>
  );
};

export default ObjectsPanel;
