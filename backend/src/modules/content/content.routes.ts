import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    items: [
      {
        id: 10,
        title: "Demo Song",
        description: "Sample",
        locked: true
      }
    ]
  });
});

router.get("/:id", (req, res) => {
  res.json({
    success: true,
    content: {
      id: req.params.id,
      title: "Demo Song",
      description: "Full description",
      locked: true,
      artwork: "art.jpg"
    }
  });
});

export default router;
