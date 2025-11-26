-- Add body diagram fields to treatment_records table
-- This migration adds support for storing body diagram annotations and images

-- Add columns for body diagram data
ALTER TABLE public.treatment_records
ADD COLUMN IF NOT EXISTS body_diagram_data JSONB,
ADD COLUMN IF NOT EXISTS body_diagram_image_url TEXT;

-- Add comments to describe the columns
COMMENT ON COLUMN public.treatment_records.body_diagram_data IS 'JSON data containing drawing strokes, annotations, pins, and view information for body diagrams';
COMMENT ON COLUMN public.treatment_records.body_diagram_image_url IS 'URL to the exported PNG image of the body diagram stored in Supabase Storage';

-- Create index on body_diagram_data for faster queries
CREATE INDEX IF NOT EXISTS idx_treatment_records_has_diagram
ON public.treatment_records ((body_diagram_data IS NOT NULL))
WHERE body_diagram_data IS NOT NULL;

-- Example of body_diagram_data JSON structure:
/*
{
  "views": {
    "front": {
      "strokes": [
        {
          "id": "uuid",
          "tool": "pen",
          "points": [x1, y1, x2, y2, ...],
          "color": "#FF0000",
          "strokeWidth": 3,
          "timestamp": "2025-01-01T00:00:00Z"
        }
      ],
      "annotations": [
        {
          "id": "uuid",
          "type": "text",
          "x": 100,
          "y": 200,
          "text": "痛みの箇所",
          "fontSize": 14,
          "color": "#000000"
        }
      ],
      "pins": [
        {
          "id": "uuid",
          "x": 150,
          "y": 250,
          "bodyPart": "RIGHT_SHOULDER",
          "note": "特に痛みが強い"
        }
      ]
    },
    "back": { ... },
    "left": { ... },
    "right": { ... }
  },
  "metadata": {
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z",
    "authorId": "uuid",
    "version": 1
  }
}
*/
