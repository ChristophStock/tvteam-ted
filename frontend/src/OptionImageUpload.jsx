import React from "react";
import { Box, Button } from "@mui/material";

export default function OptionImageUpload({ optionIdx, imageUrl, onImageChange }) {
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onImageChange(optionIdx, e.target.files[0]);
    }
  };

  return (
    <Box display="flex" alignItems="center" gap={2}>
      <input
        accept="image/*"
        style={{ display: "none" }}
        id={`option-image-upload-${optionIdx}`}
        type="file"
        onChange={handleFileChange}
      />
      <label htmlFor={`option-image-upload-${optionIdx}`}>
        <Button variant="outlined" component="span" size="small">
          Bild wählen
        </Button>
      </label>
      {imageUrl && (
        <img src={imageUrl} alt="Option" style={{ maxHeight: 40, maxWidth: 60, borderRadius: 4 }} />
      )}
    </Box>
  );
}
