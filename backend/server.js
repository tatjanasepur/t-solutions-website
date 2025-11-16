
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import rateLimit from "express-rate-limit";

dotenv.config();
const app = express();


app.use(cors({ origin: true }));
app.use(express.json());


app.use("/api/contact", rateLimit({ windowMs: 60_000, max: 5 }));


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER, 
    pass: process.env.SMTP_PASS, 
  },
});


transporter.verify((err, ok) => {
  if (err) {
    console.error("SMTP verify error:", err);
  } else {
    console.log("SMTP ready:", ok);
  }
});


app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/api/contact", async (req, res) => {
  const { name, email, message } = req.body || {};
  console.log("POST /api/contact:", req.body);

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Nedostaju polja." });
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_USER, 
      to: process.env.TO_EMAIL || process.env.SMTP_USER, 
      replyTo: email, 
      subject: `Novi upit sa sajta — ${name}`,
      text: `Ime: ${name}\nEmail: ${email}\n\n${message}`,
      html: `<p><b>Ime:</b> ${name}<br><b>Email:</b> ${email}</p><p>${String(message).replace(/\n/g, "<br>")}</p>`,
    });

    console.log("Mail sent, messageId:", info.messageId);
    return res.json({ ok: true });
  } catch (error) {
    console.error("SEND ERROR:", error);
    return res.status(500).json({ error: "Greška pri slanju mejla." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Backend radi na portu ${PORT}`));
