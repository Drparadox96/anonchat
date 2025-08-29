const express = require("express");
const bodyParser = require("body-parser");
const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Home - enter username
app.get("/", (req, res) => {
  res.render("index");
});

// Generate confession link
app.post("/create", async (req, res) => {
  const { username } = req.body;
  if (!username) return res.redirect("/");
  
  // Ensure user exists in DB
  const result = await pool.query(
    "INSERT INTO users (username) VALUES ($1) ON CONFLICT (username) DO NOTHING RETURNING id",
    [username]
  );

  res.redirect(`/${username}`);
});

// Confession page
app.get("/:username", async (req, res) => {
  const { username } = req.params;
  res.render("confession", { username });
});

// Submit confession
app.post("/:username", async (req, res) => {
  const { username } = req.params;
  const { message } = req.body;

  const user = await pool.query("SELECT id FROM users WHERE username=$1", [username]);
  if (user.rows.length > 0) {
    await pool.query("INSERT INTO confessions (user_id, message) VALUES ($1, $2)", [
      user.rows[0].id,
      message
    ]);
  }

  res.send("✅ Confession submitted anonymously! <a href='/" + username + "'>Go back</a>");
});

// View confessions
app.get("/view/:username", async (req, res) => {
  const { username } = req.params;
  const user = await pool.query("SELECT id FROM users WHERE username=$1", [username]);

  if (user.rows.length === 0) return res.send("User not found.");
  
  const confessions = await pool.query("SELECT message, created_at FROM confessions WHERE user_id=$1 ORDER BY created_at DESC", [user.rows[0].id]);

  res.render("view", { username, confessions: confessions.rows });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
