import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    artists: [
      {
        id: 1,
        name: "Artist Demo",
        banner: "banner.jpg",
        subscribers: 100
      }
    ]
  });
});

router.get("/:artistId/content", (req, res) => {
  res.json({
    success: true,
    content: [
      {
        id: 10,
        title: "Demo Song",
        artwork: "art.jpg",
        locked: true
      }
    ]
  });
});

export default router;
